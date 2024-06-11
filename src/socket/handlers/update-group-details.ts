import { SocketEvents } from "../../events";
import { clearFromRedis } from "../../redis";
import { IO_SERVER, SOCKET_PAYLOAD } from "../../utils/configureSocketIO";
import { prisma } from "../../utils/prisma";

type UpdateGroupDetailsType = {
  groupId: string;
  name?: string;
  description?: string;
};

export const updateGroupDetailsHandler = async ({
  groupId,
  name,
  description,
}: UpdateGroupDetailsType) => {
  const group = await prisma.group.update({
    where: {
      groupId,
      adminId: SOCKET_PAYLOAD.userId,
    },
    data: {
      name,
      description,
    },
    select: {
      groupId: true,
      name: true,
      description: true,
      Chat: {
        select: {
          participants: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  const groupMembers = group?.Chat.participants;

  // clear the caches
  await Promise.all([
    clearFromRedis({
      key: groupMembers.map((item) => `chats:${item.userId}`),
    }),
    await clearFromRedis({
      key: groupMembers?.map((item) => `group:${groupId}:${item.userId}`),
    }),
  ]);

  IO_SERVER.to(groupId).emit(SocketEvents.UPDATE_GROUP_DETAILS, {
    groupId,
    name: group.name,
    description: group.description,
  });
};

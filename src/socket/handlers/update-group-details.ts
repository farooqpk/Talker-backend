import { SocketEvents } from "../../events";
import { clearFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";

type UpdateGroupDetailsType = {
  groupId: string;
  name?: string;
  description?: string;
};

export const updateGroupDetailsHandler = async (
  { io, payload }: SocketHandlerParams,
  { groupId, name, description }: UpdateGroupDetailsType
) => {
  const group = await prisma.group.update({
    where: {
      groupId,
      GroupAdmin: {
        some: {
          adminId: payload.userId,
        },
      },
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

  io.to(groupId).emit(SocketEvents.UPDATE_GROUP_DETAILS, {
    groupId,
    name: group.name,
    description: group.description,
  });
};

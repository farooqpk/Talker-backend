import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";
import msgpack from "msgpack-lite";

type JoinGroup = {
  groupIds: string[];
};

export const joinGroupHandler = async (
  { io, payload, socket }: SocketHandlerParams,
  data: Buffer
) => {
  const { groupIds } = msgpack.decode(data) as JoinGroup;
  const isUserExistInGroup = await prisma.group.findFirst({
    where: {
      groupId: {
        in: groupIds,
      },
      Chat: {
        participants: {
          some: {
            userId: payload.userId,
          },
        },
      },
    },
  });

  if (isUserExistInGroup) {
    socket.join(groupIds);
  }
};

import { SOCKET, SOCKET_PAYLOAD } from "../../utils/configureSocketIO";
import { prisma } from "../../utils/prisma";

export const joinGroupHandler = async ({
  groupIds,
}: {
  groupIds: string[];
}) => {
  const isUserExistInGroup = await prisma.group.findFirst({
    where: {
      groupId: {
        in: groupIds,
      },
      Chat: {
        participants: {
          some: {
            userId: SOCKET_PAYLOAD.userId,
          },
        },
      },
    },
  });

  if (isUserExistInGroup) {
    SOCKET.join(groupIds);
  }
};

import { SocketEvents } from "../../events";
import { clearFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";

type ExitGroup = {
  groupId: string;
};

export const exitGroupHandler = async (
  { io, payload, socket }: SocketHandlerParams,
  { groupId }: ExitGroup
) => {
  const group = await prisma.group.findUnique({
    where: {
      groupId,
      Chat: {
        participants: {
          some: {
            userId: payload.userId,
          },
        },
      },
    },
    select: {
      chatId: true,
      Chat: {
        select: {
          participants: {
            select: {
              participantId: true,
              userId: true,
            },
          },
          ChatKey: {
            where: {
              userId: payload.userId,
            },
            select: {
              id: true,
            },
          },
        },
      },
      GroupAdmin: {
        select: {
          adminId: true,
        },
      },
    },
  });

  const groupMembers = group?.Chat.participants;
  const chatId = group?.chatId;
  const participantId = groupMembers?.find(
    (item) => item.userId === payload.userId
  )?.participantId;
  const isExitByAdmin = group?.GroupAdmin.some(
    ({ adminId }) => adminId === payload.userId
  );
  const adminsLength = group?.GroupAdmin?.length;

  // if the user is the admin and there is only one admin in the group
  if (isExitByAdmin && adminsLength === 1) {
    return;
  }

  await prisma.chat.update({
    where: {
      chatId,
    },
    data: {
      participants: {
        delete: {
          participantId,
        },
      },
      ChatKey: {
        delete: {
          id: group?.Chat.ChatKey[0].id,
        },
      },
      messages: {
        deleteMany: {
          senderId: payload.userId,
        },
      },
    },
  });

  // clear the caches
  await Promise.all([
    clearFromRedis({
      key: [
        `messages:${group?.chatId}`,
        `group:${groupId}:${payload.userId}`,
        `chatKey:${payload.userId}:${chatId}`,
        `chats:${payload.userId}`,
      ],
    }),
  ]);

  io.to(groupId).emit(SocketEvents.EXIT_GROUP, {
    groupId,
    exitedUserId: payload.userId,
  });
};

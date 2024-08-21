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

  await prisma.$transaction(async (tx) => {
    const messages = await tx.message.findMany({
      where: {
        senderId: payload.userId,
        chatId,
      },
      select: {
        messageId: true,
      },
    });

    const messageIds = messages.map((m) => m.messageId);

    await tx.messageStatus.deleteMany({
      where: {
        messageId: {
          in: messageIds,
        },
      },
    });

    await tx.message.deleteMany({
      where: {
        messageId: {
          in: messageIds,
        },
      },
    });

    await tx.chat.update({
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
      },
    });
  });

  // clear the caches
  await Promise.all([
    clearFromRedis({
      key: [
        `messages:${group?.chatId}`,
        `chatKey:${payload.userId}:${chatId}`,
        `chats:${payload.userId}`,
      ],
    }),
    clearFromRedis({
      key: groupMembers?.map((item) => `group:${groupId}:${item.userId}`),
    }),
  ]);

  io.to(groupId).emit(SocketEvents.EXIT_GROUP, {
    groupId,
    exitedUserId: payload.userId,
  });
};

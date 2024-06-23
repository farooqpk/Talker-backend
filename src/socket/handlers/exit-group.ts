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
    include: {
      Chat: {
        include: {
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
    },
  });

  const groupMembers = group?.Chat.participants;
  const isExitByAdmin = group?.adminId === payload.userId;
  const chatId = group?.chatId;

  await prisma.$transaction(
    async (transactionPrisma) => {
      if (isExitByAdmin) {
        // if admin then delete group
        await Promise.all([
          transactionPrisma.chatKey.deleteMany({
            where: {
              chatId,
            },
          }),
          transactionPrisma.group.delete({
            where: {
              groupId,
            },
          }),
          transactionPrisma.participants.deleteMany({
            where: {
              chatId,
            },
          }),
          transactionPrisma.message.deleteMany({
            where: {
              chatId,
            },
          }),
          transactionPrisma.chat.delete({
            where: {
              chatId,
            },
          }),
        ]);
      } else {
        // if not admin exit the group
        await transactionPrisma.chat.update({
          where: {
            chatId,
          },
          data: {
            participants: {
              delete: {
                participantId: groupMembers?.find(
                  (item) => item.userId === payload.userId
                )?.participantId,
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
      }
    },
    {
      maxWait: 10000,
      timeout: 5000,
    }
  );

  // clear the caches
  await Promise.all(
    isExitByAdmin
      ? [
          clearFromRedis({
            key: `messages:${group?.chatId}`,
          }),
          clearFromRedis({
            key: groupMembers?.map((item) => `chats:${item.userId}`),
          }),
          clearFromRedis({
            key: groupMembers?.map(
              (item) => `chatKey:${item.userId}:${chatId}`
            ),
          }),
          clearFromRedis({
            key: groupMembers?.map((item) => `group:${groupId}:${item.userId}`),
          }),
        ]
      : [
          clearFromRedis({
            key: `chats:${payload.userId}`,
          }),
          clearFromRedis({
            key: [
              `messages:${group?.chatId}`,
              `group:${groupId}:${payload.userId}`,
              `chatKey:${payload.userId}:${chatId}`,
            ],
          }),
        ]
  );

  io.to(groupId).emit(SocketEvents.EXIT_GROUP, {
    groupId,
    isExitByAdmin,
    exitedUserId: payload.userId,
  });
};

import { SocketEvents } from "../../events";
import { clearFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";

type KickMemberFromGroup = {
  groupId: string;
  userId: string;
};

export const KickMemberFromGroupHandler = async (
  { socket, payload, io }: SocketHandlerParams,
  { groupId, userId }: KickMemberFromGroup
) => {
  const adminId = payload.userId;

  const group = await prisma.group.findUnique({
    where: {
      groupId,
      GroupAdmin: {
        some: {
          adminId,
        },
      },
      Chat: {
        participants: {
          some: {
            userId,
          },
        },
      },
    },
    include: {
      Chat: {
        include: {
          ChatKey: {
            where: {
              userId,
            },
            select: {
              id: true,
            },
          },
          participants: {
            where: {
              userId,
            },
            select: {
              participantId: true,
              user: {
                select: {
                  username: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!group) return;

  const chatId = group?.chatId;
  const participantId = group?.Chat.participants[0].participantId;
  const chatKeyId = group?.Chat.ChatKey[0].id;

  await prisma.$transaction(async (tx) => {
    await tx.participants.delete({
      where: {
        participantId,
      },
    });

    await tx.chatKey.delete({
      where: {
        id: chatKeyId,
      },
    });

    await tx.message.deleteMany({
      where: {
        chatId,
        senderId: userId,
      },
    });
  });

  const allParticipants = await prisma.participants.findMany({
    where: {
      chatId,
    },
    select: {
      userId: true,
    },
  });

  await Promise.all([
    clearFromRedis({
      key: [
        `messages:${chatId}`,
        `chatKey:${userId}:${chatId}`,
        `chats:${userId}`,
        `group:${groupId}:${userId}`,
      ],
    }),

    clearFromRedis({
      key: allParticipants.map(({ userId }) => `group:${groupId}:${userId}`),
    }),
  ]);

  io.to(groupId).emit(SocketEvents.KICK_MEMBER, {
    removedUserId: userId,
    removedUserName: group?.Chat?.participants[0]?.user?.username,
  });
};

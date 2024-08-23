import { SocketEvents } from "../../events";
import { clearFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";

type DeleteGroup = {
  groupId: string;
};

export const deleteGroupHandler = async (
  { io, payload, socket }: SocketHandlerParams,
  { groupId }: DeleteGroup
) => {
  const group = await prisma.group.findUnique({
    where: {
      groupId,
      GroupAdmin: {
        some: {
          adminId: payload.userId,
        },
      },
    },
    select: {
      chatId: true,
      name: true,
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

  if (!group) {
    return;
  }

  const groupMembers = group.Chat?.participants;
  const chatId = group?.chatId;

  await prisma.$transaction(async (tx) => {
    const messages = await tx.message.findMany({
      where: {
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

    await tx.participants.deleteMany({
      where: {
        chatId,
      },
    });

    await tx.chatKey.deleteMany({
      where: {
        chatId,
      },
    });

    await tx.groupAdmin.deleteMany({
      where: {
        groupId,
      },
    });

    await tx.group.delete({
      where: {
        groupId,
      },
    });

    await tx.chat.delete({
      where: {
        chatId,
      },
    });
  });

  await Promise.all([
    clearFromRedis({
      key: [`messages:${group?.chatId}`],
    }),
    clearFromRedis({
      key: groupMembers?.map(({ userId }) => `chats:${userId}`),
    }),
    clearFromRedis({
      key: groupMembers?.map(({ userId }) => `group:${groupId}:${userId}`),
    }),
    clearFromRedis({
      key: groupMembers?.map(({ userId }) => `chatKey:${userId}:${chatId}`),
    }),
    clearFromRedis({
      key: groupMembers?.map(({ userId }) => `chatKey:${userId}:${chatId}`),
    }),
  ]);

  io.to(groupId).emit(SocketEvents.DELETE_GROUP, {
    groupName: group.name,
    deletedBy: payload.userId,
    chatId,
  });
};

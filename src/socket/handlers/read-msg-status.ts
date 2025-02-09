import { SocketEvents } from "../../events";
import { clearFromRedis, getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";
import msgpack from "msgpack-lite";

type ReadMessageStatus = {
  messageId: string;
};

export const readMessageStatusHandler = async (
  { socket, payload, io }: SocketHandlerParams,
  data: Buffer
) => {
  const { messageId } = msgpack.decode(data) as ReadMessageStatus;
  const userId = payload.userId;

  const message = await prisma.message.findUnique({
    where: {
      messageId: messageId,
      senderId: {
        not: userId,
      },
      status: {
        some: {
          userId,
        },
      },
    },
    select: {
      status: {
        where: {
          userId,
        },
        select: {
          isRead: true,
          id: true,
        },
      },
      chat: {
        select: {
          chatId: true,
          isGroup: true,
          Group: {
            select: {
              groupId: true,
            },
          },
        },
      },
      senderId: true,
    },
  });

  if (!message || message.status[0].isRead) return;

  const chatId = message.chat.chatId;
  const isGroup = message.chat.isGroup;
  const groupId = message.chat.Group[0]?.groupId;

  await Promise.all([
    prisma.messageStatus.update({
      where: {
        id: message.status[0].id,
      },
      data: {
        isRead: true,
      },
    }),

    clearFromRedis({
      key: `messages:${chatId}`,
    }),
  ]);

  if (isGroup) {
    io.to(groupId).emit(SocketEvents.READ_MESSAGE, messageId);
  } else {
    const recipentSocketId = await getDataFromRedis(
      `socket:${message.senderId}`,
      true
    );

    io.to(recipentSocketId ? [recipentSocketId, socket.id] : socket.id).emit(
      SocketEvents.READ_MESSAGE,
      messageId
    );
  }
};

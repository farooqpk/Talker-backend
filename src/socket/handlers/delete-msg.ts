import { SocketEvents } from "../../events";
import { clearFromRedis, getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";

type DeleteMsgType = {
  messageId: string;
  recipientId?: string;
  groupId?: string;
  isGroup?: boolean;
};

export const deleteMsgHandler = async (
  { io, payload, socket }: SocketHandlerParams,
  { messageId, recipientId, groupId, isGroup }: DeleteMsgType
) => {
  if ((isGroup && !groupId) || (!isGroup && !recipientId)) return;

  const msg = await prisma.message.findUnique({
    where: {
      messageId,
    },
    select: {
      messageId: true,
      senderId: true,
      chatId: true,
      chat: {
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

  if (msg?.senderId !== payload.userId) return;

  await prisma.message.update({
    where: {
      messageId,
    },
    data: {
      isDeleted: true,
    },
  });

  // clear the message cache
  const members = msg?.chat?.participants;
  await Promise.all([
    clearFromRedis({
      key: `messages:${msg.chatId}`,
    }),
    clearFromRedis({
      key: members.map((item) => `chats:${item.userId}`),
    }),
  ]);

  if (isGroup) {
    io.to(groupId!).emit(SocketEvents.DELETE_MESSAGE, messageId);
  } else {
    const recipentSocketId = await getDataFromRedis(
      `socket:${recipientId}`,
      true
    );

    io.to(recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]).emit(
      SocketEvents.DELETE_MESSAGE,
      messageId
    );
  }
};

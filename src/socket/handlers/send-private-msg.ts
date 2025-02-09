import { clearFromRedis, getDataFromRedis, setDataInRedis } from "../../redis";
import { prisma } from "../../utils/prisma";
import { ContentType, type SocketHandlerParams } from "../../types/common";
import { SocketEvents } from "../../events";
import msgpack from "msgpack-lite";

type PrivateChatType = {
  recipientId: string;
  message: {
    content?: string;
    contentType: ContentType;
    mediaPath?: string;
  };
  encryptedChatKey: Array<{ userId: string; encryptedKey: string }>;
};

export const sendPrivateMsgHandler = async (
  { io, payload, socket }: SocketHandlerParams,
  data: Buffer
) => {
  const { recipientId, message, encryptedChatKey } = msgpack.decode(
    data
  ) as PrivateChatType;

  const recipentSocketId = await getDataFromRedis(
    `socket:${recipientId}`,
    true
  );

  const users = [payload.userId, recipientId];

  const { content, contentType, mediaPath } = message;
  const IS_IMAGE_OR_AUDIO = [ContentType.IMAGE, ContentType.AUDIO].includes(
    contentType
  );

  if ((!IS_IMAGE_OR_AUDIO && !content) || (IS_IMAGE_OR_AUDIO && !mediaPath)) {
    return;
  }

  const isAlreadyChatExistCached = await getDataFromRedis(
    `isAlreadyChatExist:${users}`
  );

  let chat =
    isAlreadyChatExistCached ||
    (await prisma.chat.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: users },
          },
        },
      },
    }));

  const isNewChat = !chat;

  const result = await prisma.$transaction(async (tx) => {
    if (isNewChat) {
      chat = await tx.chat.create({
        data: {
          createdAt: new Date(),
          ChatKey: {
            createMany: {
              data: encryptedChatKey,
            },
          },
          participants: {
            createMany: {
              data: users.map((userId) => ({
                userId,
                createdAt: new Date(),
              })),
            },
          },
        },
      });
    }

    const msg = await tx.message.create({
      data: {
        content: !IS_IMAGE_OR_AUDIO ? content : null,
        mediaPath: IS_IMAGE_OR_AUDIO ? mediaPath : null,
        createdAt: new Date(),
        chatId: chat.chatId,
        senderId: payload.userId,
        contentType,
      },
      include: {
        sender: {
          select: {
            userId: true,
            username: true,
          },
        },
      },
    });

    const msgStatus = await tx.messageStatus.create({
      data: {
        userId: recipientId,
        messageId: msg.messageId,
      },
      select: {
        userId: true,
        isRead: true,
      },
    });

    return {
      msg,
      msgStatus,
    };
  });

  if (!isAlreadyChatExistCached) {
    await setDataInRedis({
      key: `isAlreadyChatExist:${users}`,
      data: chat,
      expirationTimeInSeconds: 4 * 60 * 60,
    });
  }

  await clearFromRedis({
    key: [
      `chats:${payload.userId}`,
      `chats:${recipientId}`,
      `messages:${chat.chatId}`,
    ],
  });

  // send encrypted chat keys for the initial chat, because we cant get chat key immediatly from client side from chat key api call
  io.to(recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]).emit(
    SocketEvents.SEND_PRIVATE_MESSAGE,
    msgpack.encode({
      isRefetchChatList: isNewChat,
      message: isNewChat
        ? {
            ...result.msg,
            encryptedChatKeys: encryptedChatKey,
            status: [result.msgStatus],
          }
        : {
            ...result.msg,
            status: [result.msgStatus],
          },
    })
  );
};

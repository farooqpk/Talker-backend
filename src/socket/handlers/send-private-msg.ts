import { clearFromRedis, getDataFromRedis, setDataInRedis } from "../../redis";
import { prisma } from "../../utils/prisma";
import { ContentType, SocketHandlerParams } from "../../types/common";
import { SocketEvents } from "../../events";

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
  { recipientId, message, encryptedChatKey }: PrivateChatType
) => {
  const recipentSocketId = await getDataFromRedis(
    `socket:${recipientId}`,
    true
  );

  const users = [payload.userId, recipientId];

  const { content, contentType, mediaPath } = message;
  const IS_IMAGE_OR_AUDIO =
    contentType === ContentType.IMAGE || contentType === ContentType.AUDIO;

  if ((!IS_IMAGE_OR_AUDIO && !content) || (IS_IMAGE_OR_AUDIO && !mediaPath)) {
    return;
  }

  const isAlreadyChatExistCached = await getDataFromRedis(
    `isAlreadyChatExist:${users}`
  );

  const isAlreadyChatExist =
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

  if (isAlreadyChatExist) {

    const msg = await prisma.message.create({
      data: {
        content: !IS_IMAGE_OR_AUDIO ? content  : null,
        mediaPath: IS_IMAGE_OR_AUDIO ? mediaPath  : null,
        createdAt: new Date(),
        chatId: isAlreadyChatExist.chatId,
        senderId: payload.userId,
        contentType: message.contentType,
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

    // cache isAlreadyChatExist
    if (!isAlreadyChatExistCached) {
      await setDataInRedis({
        key: `isAlreadyChatExist:${users}`,
        data: isAlreadyChatExist,
        expirationTimeInSeconds: 4 * 60 * 60,
      });
    }

    // clear both chat and message cache
    await clearFromRedis({
      key: [
        `chats:${payload.userId}`,
        `chats:${recipientId}`,
        `messages:${isAlreadyChatExist.chatId}`,
      ],
    });

    io.to(recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]).emit(
      SocketEvents.SEND_PRIVATE_MESSAGE,
      {
        isRefetchChatList: false,
        message: msg,
      }
    );
  } else {
    const chat = await prisma.chat.create({
      data: {
        createdAt: new Date(),
        ChatKey: {
          createMany: {
            data: encryptedChatKey.map((item) => ({
              userId: item.userId,
              encryptedKey: item.encryptedKey,
            })),
          },
        },
        participants: {
          createMany: {
            data: users.map((userId: string) => ({
              userId,
              createdAt: new Date(),
            })),
          },
        },
      },
    });

    const msg = await prisma.message.create({
      data: {
        content: !IS_IMAGE_OR_AUDIO ? content : null,
        createdAt: new Date(),
        chatId: chat.chatId,
        senderId: payload.userId,
        contentType: message.contentType,
        mediaPath: IS_IMAGE_OR_AUDIO ? mediaPath : null,
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

    // clear all the members chat cache
    await clearFromRedis({
      key: [`chats:${payload.userId}`, `chats:${recipientId}`],
    });

    io.to(recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]).emit(
      SocketEvents.SEND_PRIVATE_MESSAGE,
      {
        isRefetchChatList: true,
        // send encrypted chat keys for the initial chat, because we cant get chat key immediatly from client side from chat key api call
        message: { ...msg, encryptedChatKeys: encryptedChatKey },
      }
    );
  }
};

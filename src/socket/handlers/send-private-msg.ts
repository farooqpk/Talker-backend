import { clearFromRedis, getDataFromRedis, setDataInRedis } from "../../redis";
import {
  IO_SERVER,
  SOCKET,
  SOCKET_PAYLOAD,
} from "../../utils/configureSocketIO";
import { prisma } from "../../utils/prisma";
import { ContentType } from "../../types/common";
import { SocketEvents } from "../../events";

type PrivateChatType = {
  recipientId: string;
  message: {
    content?: ArrayBuffer;
    contentType: ContentType;
    mediaPath?: string;
  };
  encryptedChatKey: Array<{ userId: string; encryptedKey: ArrayBuffer }>;
};

export const sendPrivateMsgHandler = async ({
  recipientId,
  message,
  encryptedChatKey,
}: PrivateChatType) => {
  const recipentSocketId = await getDataFromRedis(
    `socket:${recipientId}`,
    true
  );

  const users = [SOCKET_PAYLOAD.userId, recipientId];
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
        content: !IS_IMAGE_OR_AUDIO ? Buffer.from(content!) : null,
        createdAt: new Date(),
        chatId: isAlreadyChatExist.chatId,
        senderId: SOCKET_PAYLOAD.userId,
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
        `chats:${SOCKET_PAYLOAD.userId}`,
        `chats:${recipientId}`,
        `messages:${isAlreadyChatExist.chatId}`,
      ],
    });

    IO_SERVER.to(
      recipentSocketId ? [recipentSocketId, SOCKET.id] : [SOCKET.id]
    ).emit(SocketEvents.SEND_PRIVATE_MESSAGE, {
      isRefetchChatList: false,
      message: msg,
    });
  } else {
    const chat = await prisma.chat.create({
      data: {
        createdAt: new Date(),
        ChatKey: {
          createMany: {
            data: encryptedChatKey.map((item) => ({
              userId: item.userId,
              encryptedKey: Buffer.from(item.encryptedKey),
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
        content: !IS_IMAGE_OR_AUDIO ? Buffer.from(content!) : null,
        createdAt: new Date(),
        chatId: chat.chatId,
        senderId: SOCKET_PAYLOAD.userId,
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
      key: [`chats:${SOCKET_PAYLOAD.userId}`, `chats:${recipientId}`],
    });

    IO_SERVER.to(
      recipentSocketId ? [recipentSocketId, SOCKET.id] : [SOCKET.id]
    ).emit(SocketEvents.SEND_PRIVATE_MESSAGE, {
      isRefetchChatList: true,
      // send encrypted chat keys for the initial chat, because we cant get chat key immediatly from client side by chat key api call
      message: { ...msg, encryptedChatKeys: encryptedChatKey },
    });
  }
};

import { clearFromRedis, getDataFromRedis, setDataInRedis } from "../../redis";
import {
  IO_SERVER,
  SOCKET,
  SOCKET_PAYLOAD,
} from "../../utils/configureSocketIO";
import { prisma } from "../../utils/prisma";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { R2_BUCKET_NAME } from "../../config";
import { s3Client } from "../../utils/r2";
import { ContentType } from "../../types/common";
import { SocketEvents } from "../../events";

type PrivateChatType = {
  recipientId: string;
  message: {
    content: ArrayBuffer;
    contentType: ContentType;
  };
  encryptedChatKey: Array<{ userId: string; encryptedKey: string }>;
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
  const { content, contentType } = message;
  const IS_IMAGE_OR_AUDIO =
    contentType === ContentType.IMAGE || contentType === ContentType.AUDIO;

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
    const uniqueKey = `${isAlreadyChatExist.chatId}/${uuidv4()}.json`;

    if (IS_IMAGE_OR_AUDIO) {
      const putObjectCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: uniqueKey,
        Body: JSON.stringify(content),
        ContentType: "application/json",
      });
      await s3Client.send(putObjectCommand);
      console.log("uploaded successfully");
    }

    const msg = await prisma.message.create({
      data: {
        content: IS_IMAGE_OR_AUDIO ? uniqueKey : content,
        createdAt: new Date(),
        chatId: isAlreadyChatExist.chatId,
        senderId: SOCKET_PAYLOAD.userId,
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
            data: encryptedChatKey.map(
              (item: { userId: string; encryptedKey: string }) => ({
                userId: item.userId,
                encryptedKey: item.encryptedKey,
              })
            ),
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

    const uniqueKey = `${chat.chatId}/${uuidv4()}.json`;

    if (IS_IMAGE_OR_AUDIO) {
      const putObjectCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: uniqueKey,
        Body: JSON.stringify(content),
        ContentType: "application/json",
      });
      await s3Client.send(putObjectCommand);
      console.log("uploaded successfully");
    }

    const msg = await prisma.message.create({
      data: {
        content: IS_IMAGE_OR_AUDIO ? uniqueKey : content,
        createdAt: new Date(),
        chatId: chat.chatId,
        senderId: SOCKET_PAYLOAD.userId,
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

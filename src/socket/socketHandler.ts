import { Server, Socket } from "socket.io";
import { DecodedPayload } from "../types/DecodedPayload";
import { prisma } from "../utils/prisma";
import { ONLINE_USERS_SOCKET } from "..";

export const socketHandler = (
  socket: Socket,
  io: Server,
  decodedPayload: DecodedPayload
) => {
  console.log(`my username is ${decodedPayload.username}`);

  socket.on("isOnline", (userId: string) => {
    if (ONLINE_USERS_SOCKET.has(userId)) {
      socket.emit("isOnline", "online");
    } else {
      socket.emit("isOnline", "offline");
    }
  });

  socket.on("isTyping", (data) => {
    const { toUserId } = data;
    if (
      ONLINE_USERS_SOCKET.has(toUserId) &&
      toUserId !== decodedPayload.userId
    ) {
      const socketId = ONLINE_USERS_SOCKET.get(toUserId);
      socketId && io.to(socketId).emit("isTyping", decodedPayload.userId);
    }
  });

  socket.on("isNotTyping", (data) => {
    const { toUserId } = data;
    if (
      ONLINE_USERS_SOCKET.has(toUserId) &&
      toUserId !== decodedPayload.userId
    ) {
      const socketId = ONLINE_USERS_SOCKET.get(toUserId);
      socketId && io.to(socketId).emit("isNotTyping", decodedPayload.userId);
    }
  });

  socket.on("sendMessage", async (data) => {
    const { userId, message } = data;
    const recipentSocketId = ONLINE_USERS_SOCKET.get(userId);
    const users = [decodedPayload.userId, userId];

    const isAlreadyChatExist = await prisma.chat.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: users },
          },
        },
      },
    });

    if (isAlreadyChatExist) {
      const msg = await prisma.message.create({
        data: {
          contentForRecipient: message.encryptedMessageForRecipient,
          contentForSender: message.encryptedMessageForSender,
          createdAt: new Date(),
          chatId: isAlreadyChatExist.chatId,
          senderId: decodedPayload.userId,
          encryptedSymetricKeyForRecipient:
            message.encryptedSymetricKeyForRecipient,
          encryptedSymetricKeyForSender: message.encryptedSymetricKeyForSender,
          contentType: message.contentType,
        },
      });

      io.to(
        recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]
      ).emit("sendMessage", {
        isRefetchChatList: false,
        message: msg,
      });
    } else {
      const chat = await prisma.chat.create({
        data: {
          createdAt: new Date(),
        },
      });

      await Promise.all(
        users.map(async (userId: string) => {
          await prisma.participants.create({
            data: {
              chatId: chat.chatId,
              userId: userId,
              createdAt: new Date(),
            },
          });
        })
      );

      const msg = await prisma.message.create({
        data: {
          contentForRecipient: message.encryptedMessageForRecipient,
          contentForSender: message.encryptedMessageForSender,
          createdAt: new Date(),
          chatId: chat.chatId,
          senderId: decodedPayload.userId,
          encryptedSymetricKeyForRecipient:
            message.encryptedSymetricKeyForRecipient,
          encryptedSymetricKeyForSender: message.encryptedSymetricKeyForSender,
          contentType: message.contentType,
        },
      });
      io.to(
        recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]
      ).emit("sendMessage", {
        isRefetchChatList: true,
        message: msg,
      });
    }
  });

  socket.on("joinGroup", async ({ groupIds }) => {
    console.log("joinGroup", groupIds);
    const isUserExistInGroup = await prisma.group.findFirst({
      where: {
        groupId: {
          in: groupIds,
        },
        Chat: {
          participants: {
            some: {
              userId: decodedPayload.userId,
            },
          },
        },
      },
    });

    if (isUserExistInGroup) {
      socket.join(groupIds);
    }
  });

  socket.on("leaveGroup", ({ groupIds }) => {
    socket.leave(groupIds);
    console.log("leaveGroup", groupIds);
  });

  socket.on("sendMessageForGroup", async ({ groupId, message }) => {
    const isUserExistInGroup = await prisma.group.findFirst({
      where: {
        groupId,
        Chat: {
          participants: {
            some: {
              userId: decodedPayload.userId,
            },
          },
        },
      },
    });
    if (!isUserExistInGroup) return;

    const msg = await prisma.message.create({
      data: {
        chatId: isUserExistInGroup.chatId,
        contentType: message.contentType,
        contentForGroup: message.contentForGroup,
        createdAt: new Date(),
        senderId: decodedPayload.userId,
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

    io.to(groupId).emit("sendMessageForGroup", msg);
  });
};

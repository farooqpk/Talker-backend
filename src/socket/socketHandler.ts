import { Server, Socket } from "socket.io";
import { DecodedPayload } from "../types/DecodedPayload";
import { prisma } from "../utils/prisma";
import { ONLINE_USERS_PEER, ONLINE_USERS_SOCKET } from "..";

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

    const quickMsg = {
      contentForRecipient: message.encryptedMessageForRecipient,
      contentForSender: message.encryptedMessageForSender,
      createdAt: new Date(),
      chatId: isAlreadyChatExist?.chatId,
      senderId: decodedPayload.userId,
      encryptedSymetricKeyForRecipient:
        message.encryptedSymetricKeyForRecipient,
      encryptedSymetricKeyForSender: message.encryptedSymetricKeyForSender,
      contentType: message.contentType,
    };

    io.to(recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]).emit(
      "sendMessage",
      quickMsg
    );

    if (isAlreadyChatExist) {
      io.to(
        recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]
      ).emit("updateChatList", {
        isRefetchChatList: false,
        message: quickMsg,
      });

      await prisma.message.create({
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

      await prisma.message.create({
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
      ).emit("updateChatList", {
        isRefetchChatList: true,
      });
    }
  });

  socket.on("storePeerId", (peerId: string) => {
    console.log("storePeerId", peerId);
    ONLINE_USERS_PEER.set(decodedPayload.userId, peerId);
  });

  socket.on("getAnotherUserPeerId", (userId: string) => {
    const peerId = ONLINE_USERS_PEER.get(userId);
    socket.emit("getAnotherUserPeerId", peerId);
  });

  socket.on("removePeerId", () => {
    ONLINE_USERS_PEER.delete(decodedPayload.userId);
  });

  socket.on("answerOrRejectCall", (data) => {
    const { toUserId } = data;
    console.log(data);

    if (
      ONLINE_USERS_SOCKET.has(toUserId) &&
      toUserId !== decodedPayload.userId
    ) {
      const socketId = ONLINE_USERS_SOCKET.get(toUserId);
      socketId &&
        io.to(socketId).emit("answerOrRejectCall", {
          fromUserId: decodedPayload.userId,
          fromUsername: decodedPayload.username,
          callType: data.callType,
        });
    }
  });

  socket.on("callAnswered", (data) => {
    const { toUserId } = data;
    if (
      ONLINE_USERS_SOCKET.has(toUserId) &&
      toUserId !== decodedPayload.userId
    ) {
      const socketId = ONLINE_USERS_SOCKET.get(toUserId);
      socketId && io.to(socketId).emit("callAnswered");
    }
  });
};

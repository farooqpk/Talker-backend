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

  socket.on(
    "sendPrivateMessage",
    async ({ recipientId, message, encryptedChatKey }) => {
      const recipentSocketId = ONLINE_USERS_SOCKET.get(recipientId);
      const users = [decodedPayload.userId, recipientId];

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
            content: message.content,
            createdAt: new Date(),
            chatId: isAlreadyChatExist.chatId,
            senderId: decodedPayload.userId,
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

        io.to(
          recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]
        ).emit("sendPrivateMessage", {
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

        const msg = await prisma.message.create({
          data: {
            content: message.content,
            createdAt: new Date(),
            chatId: chat.chatId,
            senderId: decodedPayload.userId,
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
        io.to(
          recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]
        ).emit("sendPrivateMessage", {
          isRefetchChatList: true,
          message: msg,
        });
      }
    }
  );

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
        content: message.content,
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

    io.to(groupId).emit("sendMessageForGroup", { message: msg });
  });
};

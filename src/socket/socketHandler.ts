import { Server, Socket } from "socket.io";
import { DecodedPayload } from "../types/DecodedPayload";
import { prisma } from "../utils/prisma";
import { ONLINE_USERS_SOCKET, eventEmitter } from "..";

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
          // send encrypted chat keys for the initial chat, because we cant get chat key immediatly from client side by chat key api call
          message: { ...msg, encryptedChatKeys: encryptedChatKey },
        });
      }
    }
  );

  socket.on("joinGroup", async ({ groupIds }) => {
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
      console.log("joinGroup", groupIds);
    }
  });

  socket.on("leaveGroup", ({ groupIds }) => {
    groupIds?.forEach((id: string) => socket.leave(id));
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

  socket.on(
    "deleteMessage",
    async ({
      messageId,
      recipientId,
      groupId,
      isGroup,
    }: {
      messageId: string;
      recipientId?: string;
      groupId?: string;
      isGroup?: boolean;
    }) => {
      if ((isGroup && !groupId) || (!isGroup && !recipientId)) return;

      const msg = await prisma.message.findUnique({
        where: {
          messageId,
        },
      });

      if (msg?.senderId !== decodedPayload.userId) return;
      await prisma.message.update({
        where: {
          messageId,
        },
        data: {
          isDeleted: true,
        },
      });

      if (isGroup) {
        io.to(groupId!).emit("deleteMessage", messageId);
      } else {
        const recipentSocketId = ONLINE_USERS_SOCKET.get(recipientId!);
        io.to(
          recipentSocketId ? [recipentSocketId, socket.id] : [socket.id]
        ).emit("deleteMessage", messageId);
      }
    }
  );

  socket.on("exitGroup", async ({ groupId }) => {
    const group = await prisma.group.findUnique({
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
      include: {
        Chat: {
          include: {
            participants: {
              where: {
                userId: decodedPayload.userId,
              },
              select: {
                participantId: true,
              },
            },
            ChatKey: {
              where: {
                userId: decodedPayload.userId,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    const isExitByAdmin = group?.adminId === decodedPayload.userId;

    await prisma.$transaction(
      async (transactionPrisma) => {
        if (isExitByAdmin) {
          // if admin then delete group
          await Promise.all([
            transactionPrisma.chatKey.deleteMany({
              where: {
                chatId: group?.chatId,
              },
            }),
            transactionPrisma.group.delete({
              where: {
                groupId,
              },
            }),
            transactionPrisma.participants.deleteMany({
              where: {
                chatId: group?.chatId,
              },
            }),
            transactionPrisma.message.deleteMany({
              where: {
                chatId: group?.chatId,
              },
            }),
            transactionPrisma.chat.delete({
              where: {
                chatId: group?.chatId,
              },
            }),
          ]);
        } else {
          // if not admin exit the group
          await transactionPrisma.chat.update({
            where: {
              chatId: group?.chatId,
            },
            data: {
              participants: {
                delete: {
                  participantId: group?.Chat.participants[0].participantId,
                },
              },
              ChatKey: {
                delete: {
                  id: group?.Chat.ChatKey[0].id,
                },
              },
              messages: {
                deleteMany: {
                  senderId: decodedPayload.userId,
                },
              },
            },
          });
        }
      },
      {
        maxWait: 10000,
        timeout: 5000,
      }
    );

    io.to(groupId).emit("exitGroup", {
      groupId,
      isExitByAdmin,
      exitedUserId: decodedPayload.userId,
    });
  });

  eventEmitter.on("groupCreated", (users) => {
    let usersSocket: string[] = [];
    for (let i = 0; i < users.length; i++) {
      if (ONLINE_USERS_SOCKET.has(users[i])) {
        usersSocket.push(ONLINE_USERS_SOCKET.get(users[i] as string)!);
      }
    }
    io.to(usersSocket).emit("groupCreated");
  });
};

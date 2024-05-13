import { Server, Socket } from "socket.io";
import { DecodedPayload } from "../types/DecodedPayload";
import { prisma } from "../utils/prisma";
import { ONLINE_USERS_SOCKET, eventEmitter } from "..";
import {
  clearCacheFromRedis,
  getDataFromRedis,
  setDataInRedis,
} from "../redis";

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

        // cache isAlreadyChatExist
        if (!isAlreadyChatExistCached) {
          await setDataInRedis(
            `isAlreadyChatExist:${users}`,
            isAlreadyChatExist,
            4 * 60 * 60
          );
        }

        // clear both chat and message cache
        await clearCacheFromRedis({
          key: [
            `messages:${isAlreadyChatExist.chatId}`,
            `chats:${decodedPayload.userId}`,
            `chats:${recipientId}`,
          ],
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

        // clear all the members chat cache
        await clearCacheFromRedis({
          key: [
            `chats:${decodedPayload.userId}`,
            `chats:${recipientId}`,
            `user:${decodedPayload.userId}`,
            `user:${recipientId}`,
          ],
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
    groupIds?.forEach((id: string) => {
      socket.leave(id);
      console.log("leaveGroup", id);
    });
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
      select: {
        chatId: true,
        Chat: {
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

    // clear the message cache
    const groupMembersClearChatsKey = isUserExistInGroup.Chat.participants.map(
      (item) => `chats:${item.userId}`
    );

    await Promise.all([
      clearCacheFromRedis({
        key: `messages:${isUserExistInGroup.chatId}`,
      }),
      clearCacheFromRedis({ key: groupMembersClearChatsKey }),
    ]);

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

      if (msg?.senderId !== decodedPayload.userId) return;

      await prisma.message.update({
        where: {
          messageId,
        },
        data: {
          isDeleted: true,
        },
      });

      // clear the message cache
      const membersClearChatsKey = msg?.chat?.participants?.map(
        (item) => `chats:${item.userId}`
      );
      await Promise.all([
        clearCacheFromRedis({
          key: `messages:${msg.chatId}`,
        }),
        clearCacheFromRedis({ key: membersClearChatsKey }),
      ]);

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
              select: {
                participantId: true,
                userId: true,
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

    const groupMembers = group?.Chat.participants;
    const isExitByAdmin = group?.adminId === decodedPayload.userId;
    const chatId = group?.chatId;

    await prisma.$transaction(
      async (transactionPrisma) => {
        if (isExitByAdmin) {
          // if admin then delete group
          await Promise.all([
            transactionPrisma.chatKey.deleteMany({
              where: {
                chatId,
              },
            }),
            transactionPrisma.group.delete({
              where: {
                groupId,
              },
            }),
            transactionPrisma.participants.deleteMany({
              where: {
                chatId,
              },
            }),
            transactionPrisma.message.deleteMany({
              where: {
                chatId,
              },
            }),
            transactionPrisma.chat.delete({
              where: {
                chatId,
              },
            }),
          ]);
        } else {
          // if not admin exit the group
          await transactionPrisma.chat.update({
            where: {
              chatId,
            },
            data: {
              participants: {
                delete: {
                  participantId: groupMembers?.find(
                    (item) => item.userId === decodedPayload.userId
                  )?.participantId,
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

    // clear the caches
    await Promise.all(
      isExitByAdmin
        ? [
            clearCacheFromRedis({
              key: groupMembers?.map((item) => `chats:${item.userId}`),
            }),
            clearCacheFromRedis({
              key: groupMembers?.map(
                (item) => `chatKey:${item.userId}:${chatId}`
              ),
            }),
            clearCacheFromRedis({
              key: `messages:${group?.chatId}`,
            }),
            clearCacheFromRedis({
              key: groupMembers?.map(
                (item) => `group:${groupId}:${item.userId}`
              ),
            }),
          ]
        : [
            clearCacheFromRedis({
              key: [
                `chats:${decodedPayload.userId}`,
                `messages:${group?.chatId}`,
                `group:${groupId}:${decodedPayload.userId}`,
                `chatKey:${decodedPayload.userId}:${chatId}`,
              ],
            }),
          ]
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

  socket.on(
    "updateGroupDetails",
    async ({
      groupId,
      name,
      description,
    }: {
      groupId: string;
      name?: string;
      description?: string;
    }) => {
      const group = await prisma.group.update({
        where: {
          groupId,
          adminId: decodedPayload.userId,
        },
        data: {
          name,
          description,
        },
        select: {
          groupId: true,
          name: true,
          description: true,
          Chat: {
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

      const groupMembers = group?.Chat.participants;

      // clear the caches
      await clearCacheFromRedis({
        key: groupMembers?.map((item) => `chats:${item.userId}`),
      });
      await clearCacheFromRedis({
        key: groupMembers?.map((item) => `group:${groupId}:${item.userId}`),
      });

      io.to(groupId).emit("updateGroupDetails", {
        groupId,
        name: group.name,
        description: group.description,
      });
    }
  );
};

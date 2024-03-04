import { Server, Socket } from "socket.io";
import { DecodedPayload } from "../types/DecodedPayload";
import { prisma } from "../utils/prisma";

export const socketHandler = (
  socket: Socket,
  io: Server,
  decodedPayload: DecodedPayload
) => {
  console.log(`my username is ${decodedPayload.username}`);

  socket.on("message", async (data) => {
    const { msg, users } = data;

    const isAlreadyChatExist = await prisma.chat.findFirst({
      where: {
        participants: {
          some: {
            userId: {
              in: users,
            },
          },
        },
      },
    });

    if (isAlreadyChatExist) {
      await prisma.message.create({
        data: {
          content: msg,
          createdAt: new Date(),
          contentType: "text",
          chatId: isAlreadyChatExist.chatId,
          mediaUrl: "",
          senderId: decodedPayload.userId,
        },
      });

      io.to(isAlreadyChatExist.chatId).emit("message", {
        msg,
        chatId: isAlreadyChatExist.chatId,
        senderId: decodedPayload.userId,
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
          content: msg,
          createdAt: new Date(),
          contentType: "text",
          chatId: chat.chatId,
          mediaUrl: "",
          senderId: decodedPayload.userId,
        },
      });

      io.to(chat.chatId).emit("message", {
        msg,
        chatId: chat.chatId,
        senderId: decodedPayload.userId,
      });
    }
  });
};

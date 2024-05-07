import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const messageList = async (req: Request, res: Response) => {
  try {
    const chatId = req.params.chatId;

    const messages = await prisma.message.findMany({
      where: {
        chatId: chatId,
        chat: {
          participants: {
            some: {
              userId: req.userId,
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
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

    res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "There is an error while fetching messages",
    });
  }
};

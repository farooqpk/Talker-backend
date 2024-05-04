import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const chatList = async (req: Request, res: Response) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: {
              equals: req.userId,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            contentType: true,
          },
        },
        participants: {
          where: { userId: { not: req.userId } },
          select: {
            user: { select: { username: true, userId: true } },
          },
        },
        Group: {
          select: {
            groupId: true,
            name: true,
            description: true,
          },
        },
        ChatKey: {
          where: {
            userId: req.userId,
          },
          select: {
            encryptedKey: true,
          },
        },
      },
    });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "there is an error while fetching chats",
    });
  }
};

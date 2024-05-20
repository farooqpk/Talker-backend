import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getDataFromRedis, setDataInRedis } from "../../redis/index";

export const chatList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const cachedChats = await getDataFromRedis(`chats:${req.userId}:${page}`);
    if (cachedChats) return res.status(200).json(cachedChats);

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
      skip: skip,
      take: limit,
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
            isDeleted: true,
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

    await setDataInRedis(`chats:${req.userId}:${page}`, chats, 4 * 60 * 60);
    res.status(200).json(chats);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "there is an error while fetching chats",
    });
  }
};

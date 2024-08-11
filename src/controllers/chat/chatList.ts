import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getDataFromRedis, setDataInRedis } from "../../redis/index";

export const chatList = async (req: Request, res: Response) => {
  try {
    const cachedChats = await getDataFromRedis(`chats:${req.userId}`);
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
            sender: {
              select: {
                username: true,
              },
            },
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
            GroupAdmin: {
              select: {
                adminId: true,
              },
            },
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

    // sort based on last message
    chats.sort((a: any, b: any) => {
      return (
        b?.messages?.[0]?.createdAt - a?.messages?.[0]?.createdAt ||
        b.createdAt - a.createdAt
      );
    });

    await setDataInRedis({
      key: `chats:${req.userId}`,
      data: chats,
      expirationTimeInSeconds: 4 * 60 * 60,
    });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "there is an error while fetching chats",
    });
  }
};

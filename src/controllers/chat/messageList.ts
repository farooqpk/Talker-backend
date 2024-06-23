import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getDataFromRedis, setDataInRedis } from "../../redis/index";

export const messageList = async (req: Request, res: Response) => {
  try {
    const chatId = req.params.chatId;

    const cachedMessages = await getDataFromRedis(`messages:${chatId}`);
    if (cachedMessages) return res.status(200).json(cachedMessages);

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

    await setDataInRedis({
      key: `messages:${chatId}`,
      data: messages,
      expirationTimeInSeconds: 4 * 60 * 60,
    });

    res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "There is an error while fetching messages",
    });
  }
};

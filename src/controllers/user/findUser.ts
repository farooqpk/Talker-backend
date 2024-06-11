import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getDataFromRedis, setDataInRedis } from "../../redis";

export const findUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const cachedUser = await getDataFromRedis(`user:${userId}`);
    if (cachedUser) return res.status(200).json(cachedUser);

    const user = await prisma.user.findUnique({
      where: {
        userId,
      },
      select: {
        userId: true,
        username: true,
        publicKey: true,
      },
    });

    const chat = await prisma.chat.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [userId, req.userId],
            },
          },
        },
      },
      select: {
        chatId: true,
      },
    });

    if (!user || !chat) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    await setDataInRedis({
      key: `user:${userId}`,
      data: {
        ...user,
        ...chat,
      },
      expirationTimeInSeconds: 12 * 60 * 60,
    });

    res.status(200).json({
      ...user,
      ...chat,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "there is an error while fetching user",
    });
  }
};

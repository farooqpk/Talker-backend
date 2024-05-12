import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { setDataInRedis, getDataFromRedis } from "../../redis/index";

export const getChatKey = async (req: Request, res: Response) => {
  try {
    const chatId = req.params.chatId;

    const cachedChatKey = await getDataFromRedis(
      `chatKey:${req.userId}:${chatId}`
    );
    if (cachedChatKey) return res.status(200).json(cachedChatKey);

    const chatKey = await prisma.chatKey.findFirst({
      where: {
        chatId,
        userId: req.userId,
      },
      select: {
        encryptedKey: true,
      },
    });

    await setDataInRedis(
      `chatKey:${req.userId}:${chatId}`,
      chatKey,
      8 * 60 * 60,
    );

    res.status(200).json(chatKey);
  } catch (error) {
    res.status(500).json(error);
  }
};

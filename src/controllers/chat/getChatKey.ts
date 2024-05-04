import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const getChatKey = async (req: Request, res: Response) => {
  try {
    const chatId = req.params.chatId;
    const groupKey = await prisma.chatKey.findFirst({
      where: {
        chatId,
        userId: req.userId,
      },
      select: {
        encryptedKey: true,
      },
    });
    res.status(200).json(groupKey);
  } catch (error) {
    res.status(500).json(error);
  }
};

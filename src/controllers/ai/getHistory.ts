import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const getAiChatHistory = async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const data = await prisma.aiChatHistory.findMany({
      where: {
        userId,
      },
      select: {
        content: true,
        role: true,
      },
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

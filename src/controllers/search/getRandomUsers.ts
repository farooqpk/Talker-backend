import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const getRandomUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        userId: {
          not: {
            equals: req.userId,
          },
        },
      },
      take: 5,
      select: {
        userId: true,
        username: true,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "there is an error while fetching users",
    });
  }
};

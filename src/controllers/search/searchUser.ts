import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        userId: {
          not: {
            equals: req.userId,
          },
        },
      },
      select: {
        userId: true,
        username: true,
      },
    });

    res.status(200).json(
      users.map((item) => {
        return { label: item.username, value: item.userId };
      })
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "There was an error while fetching users.",
    });
  }
};

import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { page, search } = req.query;

    const pageNumber = Number(page) || 1;
    const searchTerm = search ? String(search) : null;

    const users = await prisma.user.findMany({
      where: {
        userId: {
          not: {
            equals: req.userId,
          },
        },
        ...(searchTerm && {
          username: {
            contains: searchTerm as string,
          },
        }),
      },
      select: {
        userId: true,
        username: true,
      },
      take: 5,
      skip: (pageNumber - 1) * 5,
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "There was an error while fetching users.",
    });
  }
};

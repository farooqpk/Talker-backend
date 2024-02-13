import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const searchUser = async (req: Request, res: Response) => {
  try {
    const searchQuery = req?.query?.username;
    if (searchQuery === "" || typeof searchQuery !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "search query should not be empty" });
    }

    const users = await prisma.user.findMany({
      where: {
        userId: {
          not: {
            equals: req.userId,
          },
        },
        username: {
          contains: searchQuery,
        },
      },
      select: {
        userId: true,
        username: true,
      },
    });

    if (users.length < 1) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error while searching user" });
  }
};

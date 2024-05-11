import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getDataFromRedis, setDataInRedis } from "../../redis/index";

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const searchValue = req.query?.search as string;

    const cachedUsers = await getDataFromRedis(`userid_not:${req.userId}`);
    if (cachedUsers) return res.status(200).json(cachedUsers);

    const users = await prisma.user.findMany({
      where: {
        userId: {
          not: {
            equals: req.userId,
          },
        },
        ...(searchValue && {
          username: {
            contains: searchValue,
            mode: "insensitive",
          },
        }),
      },
      select: {
        userId: true,
        username: true,
      },
    });

    await setDataInRedis(`userid_not:${req.userId}`, users, 4 * 60 * 60);

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

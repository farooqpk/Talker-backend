import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getDataFromRedis, setDataInRedis } from "../../redis/index";

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const isInfiniteScroll = req.query.isInfiniteScroll;
    const searchValue = req.query?.search as string;
    const page = parseInt(req.query.page as string);
    const limit = 6;
    const skip = (page - 1) * limit;

    if (!searchValue) {
      const cachedUsers = await getDataFromRedis(
        `userid_not:${req.userId}:${page}`
      );
      if (cachedUsers) return res.status(200).json(cachedUsers);
    }

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
      ...(!searchValue &&
        isInfiniteScroll === "true" && {
          skip: skip,
          take: limit,
        }),
      select: {
        userId: true,
        username: true,
      },
    });

    const modifiedUsers = users.map((item) => {
      return { label: item.username, value: item.userId };
    });

    if (!searchValue) {
      await setDataInRedis({
        key: `userid_not:${req.userId}:${page}`,
        data: modifiedUsers,
        expirationTimeInSeconds: 3 * 60 * 60,
      });
    }

    res.status(200).json(modifiedUsers);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "There was an error while fetching users.",
    });
  }
};

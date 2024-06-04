import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { clearFromRedis } from "../../redis";

export const updateUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    const isUserNameAlreadyExist = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (
      isUserNameAlreadyExist &&
      isUserNameAlreadyExist?.userId !== req.userId
    ) {
      return res.status(404).json({
        success: false,
        message: "username already exist",
      });
    }
    const user = await prisma.user.update({
      where: {
        userId: req.userId,
      },
      data: {
        username,
      },
    });

    await Promise.all([
      clearFromRedis({ pattern: `userid_not:*` }),
      clearFromRedis({ key: `user:${user.userId}` }),
    ]);
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json(error);
  }
};

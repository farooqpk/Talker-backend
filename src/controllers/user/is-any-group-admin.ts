import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const isAnyGroupAdmin = async (req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        GroupAdmin: {
          some: {
            adminId: req.userId,
          },
        },
      },
    });

    const status = {
      isAnyGroupAdmin: groups.length > 0,
    };

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json(error);
  }
};

import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const groupDetails = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId;
    const group = await prisma.group.findUnique({
      where: {
        groupId,
        Chat: {
          participants: {
            some: {
              userId: req.userId,
            },
          },
        },
      },
      include: {
        Chat: {
          include: {
            participants: {
              select: {
                user: {
                  select: {
                    userId: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
        GroupKey: {
          where: {
            userId: req.userId,
            groupId,
          },
          select: {
            encryptedGroupKey: true,
          },
        },
      },
    });

    return res.json(group);
  } catch (error) {
    return res.json({
      success: false,
      message: "There is an error while fetching group details",
    });
  }
};

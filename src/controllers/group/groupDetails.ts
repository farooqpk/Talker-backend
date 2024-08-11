import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getDataFromRedis, setDataInRedis } from "../../redis/index";

export const groupDetails = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId;

    const catchedGroupDetails = await getDataFromRedis(
      `group:${groupId}:${req.userId}`
    );
    if (catchedGroupDetails) return res.status(200).json(catchedGroupDetails);

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
            ChatKey: {
              where: {
                userId: req.userId,
              },
              select: {
                encryptedKey: true,
              },
            },
          },
        },
        GroupAdmin: {
          select: {
            adminId: true,
          },
        },
      },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    await setDataInRedis({
      key: `group:${groupId}:${req.userId}`,
      data: group,
      expirationTimeInSeconds: 12 * 60 * 60,
    });

    return res.json(group);
  } catch (error) {
    return res.json({
      success: false,
      message: "There is an error while fetching group details",
    });
  }
};

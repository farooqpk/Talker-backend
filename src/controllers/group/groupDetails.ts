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

    const transformData = {
      groupId: group.groupId,
      chatId: group.Chat.chatId,
      name: group.name,
      description: group.description,
      createdAt: group.createdAt.toISOString(),
      Chat: {
        participants: group.Chat.participants.map(({ user }) => user),
        encryptedKeys: group.Chat.ChatKey.map(
          ({ encryptedKey }) => encryptedKey
        ),
      },
      admins: group.GroupAdmin.map(({ adminId }) => adminId),
    };

    await setDataInRedis({
      key: `group:${groupId}:${req.userId}`,
      data: transformData,
      expirationTimeInSeconds: 12 * 60 * 60,
    });

    return res.status(200).json(transformData);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "There is an error while fetching group details",
    });
  }
};

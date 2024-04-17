import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

type CreateGroupType = {
  groupName: string;
  description: string;
  membersWithEncryptedGroupKey: Array<{
    userId: string;
    encryptedGroupKey: string;
  }>;
};
export const createGroup = async (req: Request, res: Response) => {
  try {
    const {
      groupName,
      description,
      membersWithEncryptedGroupKey,
    }: CreateGroupType = req.body;

    const chat = await prisma.chat.create({
      data: {
        createdAt: new Date(),
        isGroup: true,
        Group: {
          create: {
            name: groupName,
            description,
            createdAt: new Date(),
            adminId: req.userId,
          },
        },
        participants: {
          createMany: {
            data: membersWithEncryptedGroupKey.map(({ userId }) => ({
              userId,
              createdAt: new Date(),
            })),
          },
        },
      },
      include: {
        Group: {
          select: {
            groupId: true,
          },
        },
        participants: {
          select: {
            participantId: true,
            userId: true,
          },
        },
      },
    });

    await prisma.groupKey.createMany({
      data: membersWithEncryptedGroupKey.map(
        ({ encryptedGroupKey, userId }, i) => ({
          encryptedGroupKey,
          groupId: chat.Group[0].groupId,
          userId,
          createdAt: new Date(),
        })
      ),
    });

    res.status(200).json(chat);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "there is an error while creating group",
    });
  }
};

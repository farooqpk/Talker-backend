import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { EncryptedChatKey } from "../../types/common";
import { eventEmitter } from "../../server";
import { clearFromRedis } from "../../redis/index";
import { AppEvents } from "../../events";

interface CreateGroupType extends EncryptedChatKey {
  groupName: string;
  description: string;
}
export const createGroup = async (req: Request, res: Response) => {
  try {
    const { groupName, description, encryptedChatKey }: CreateGroupType =
      req.body;

    const members = encryptedChatKey.map((item) => item.userId);

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
            data: members.map((userId) => ({
              userId,
              createdAt: new Date(),
            })),
          },
        },
        ChatKey: {
          createMany: {
            data: encryptedChatKey.map(({ userId, encryptedKey }) => ({
              userId,
              encryptedKey,
            })),
          },
        },
      },
    });

    // clear all the members chat cache
    await clearFromRedis({
      key: members.map((userId) => `chats:${userId}`),
    }),
      // emit event for members except admin
      eventEmitter.emit(
        AppEvents.GROUP_CREATED,
        members.map((userId) => userId).filter((id) => id !== req.userId)
      );

    res.status(200).json(chat);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "there is an error while creating group",
    });
  }
};

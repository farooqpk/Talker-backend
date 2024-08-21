import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { getDataFromRedis, setDataInRedis } from "../../redis/index";

export const chatList = async (req: Request, res: Response) => {
  try {
    const cachedChats = await getDataFromRedis(`chats:${req.userId}`);
    if (cachedChats) return res.status(200).json(cachedChats);

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: {
              equals: req.userId,
            },
          },
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderId: true,
            contentType: true,
            isDeleted: true,
            sender: {
              select: {
                username: true,
              },
            },
          },
        },
        participants: {
          where: { userId: { not: req.userId } },
          select: {
            user: { select: { username: true, userId: true } },
          },
        },
        Group: {
          select: {
            groupId: true,
            name: true,
            description: true,
            GroupAdmin: {
              select: {
                adminId: true,
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
    });

    const transofrmedChats = chats?.map(
      ({ ChatKey, Group, messages, participants, ...rest }) => {
        const encryptedKey = ChatKey[0]?.encryptedKey;
        const recipient = participants?.[0]?.user;
        const group = Group?.[0];
        const message = messages[0];
        return {
          ...rest,
          recipient,
          encryptedKey,
          group,
          message,
        };
      }
    );

    // sort based on last message
    transofrmedChats.sort((a, b) => {
      const bCreatedAt =
        b?.message?.createdAt instanceof Date
          ? b.message.createdAt.getTime()
          : 0;
      const aCreatedAt =
        a?.message?.createdAt instanceof Date
          ? a.message?.createdAt.getTime()
          : 0;
      return bCreatedAt - aCreatedAt;
    });

    await setDataInRedis({
      key: `chats:${req.userId}`,
      data: transofrmedChats,
      expirationTimeInSeconds: 4 * 60 * 60,
    });
    res.status(200).json(transofrmedChats);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "there is an error while fetching chats",
    });
  }
};

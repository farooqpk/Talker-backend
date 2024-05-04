import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";

export const exitGroup = async (req: Request, res: Response) => {
  try {
    const groupId = req.params.groupId;
    const group = await prisma.group.findUniqueOrThrow({
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
              where: {
                userId: req.userId,
              },
              select: {
                participantId: true,
              },
            },
            ChatKey: {
              where: {
                userId: req.userId,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    return await prisma.$transaction(
      async (transactionPrisma) => {
        if (group?.adminId === req.userId) {
          // if admin everyone exit the group
          await Promise.all([
            transactionPrisma.chatKey.deleteMany({
              where: {
                chatId: group?.chatId,
              },
            }),
            transactionPrisma.group.delete({
              where: {
                groupId,
              },
            }),
            transactionPrisma.participants.deleteMany({
              where: {
                chatId: group?.chatId,
              },
            }),
            transactionPrisma.message.deleteMany({
              where: {
                chatId: group?.chatId,
              },
            }),
            transactionPrisma.chat.delete({
              where: {
                chatId: group?.chatId,
              },
            }),
          ]);

          return res.status(200).json({
            success: true,
            message: "Group deleted successfully",
          });
        } else {
          // if not admin exit the group
          await transactionPrisma.chat.update({
            where: {
              chatId: group?.chatId,
            },
            data: {
              participants: {
                delete: {
                  participantId: group?.Chat.participants[0].participantId,
                },
              },
              ChatKey: {
                delete: {
                  id: group?.Chat.ChatKey[0].id,
                },
              },
            },
          });

          return res.status(200).json({
            success: true,
            message: "Group exited successfully",
          });
        }
      },
      {
        maxWait: 10000,
        timeout: 5000,
      }
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "There is an error while exiting the group",
    });
  }
};

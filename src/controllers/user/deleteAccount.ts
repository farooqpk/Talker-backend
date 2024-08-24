import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import { clearFromRedis } from "../../redis";
import { setDataAsSetInRedis } from "../../redis/set-data-as-set";

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.userId;
  const accesstoken = req.cookies.accesstoken;
  const refreshtoken = req.cookies.refreshtoken;

  const groups = await prisma.group.findMany({
    where: {
      GroupAdmin: {
        some: {
          adminId: userId,
        },
      },
    },
    select: {
      GroupAdmin: {
        where: {
          adminId: {
            not: userId,
          },
        },
      },
    },
  });

  const isAnyGroupAdmin = groups.length > 0;
  const doAllGroupsHaveRemainingAdmins = groups?.every(
    ({ GroupAdmin }) => GroupAdmin?.length > 0
  );

  if (isAnyGroupAdmin && !doAllGroupsHaveRemainingAdmins) {
    return res.status(403).json({
      message:
        "You are the only admin of one or more groups. Please transfer admin rights to another user before deleting your account.",
    });
  }

  const allAssociatedChats = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          userId,
        },
      },
    },
    select: {
      chatId: true,
      isGroup: true,
      participants: {
        select: {
          userId: true,
        },
      },
      Group: {
        select: {
          groupId: true,
        },
      },
    },
  });

  const allAssociatedChatIds = allAssociatedChats?.flatMap(
    ({ chatId }) => chatId
  );

  const allAssociatedChatParticipantIds = allAssociatedChats?.flatMap(
    ({ participants }) => participants.map(({ userId }) => userId)
  );

  const allAssociatedGroupIds = allAssociatedChats?.flatMap(({ Group }) =>
    Group?.map(({ groupId }) => groupId)
  );

  const allPersonalMsgChatIds = allAssociatedChats
    ?.filter(({ isGroup }) => isGroup === false)
    ?.flatMap(({ chatId }) => chatId);

  const allPersonalMsgParticipantIds = allAssociatedChats
    ?.filter(({ isGroup }) => isGroup === false)
    ?.flatMap(({ participants }) => participants.map(({ userId }) => userId));

  try {
    await prisma.$transaction(async (tx) => {
      await tx.messageStatus.deleteMany({
        where: {
          OR: [
            { userId },
            { userId: { in: allPersonalMsgParticipantIds } },
            { message: { senderId: userId } },
            { message: { senderId: { in: allPersonalMsgParticipantIds } } },
          ],
        },
      });

      await tx.message.deleteMany({
        where: {
          OR: [
            {
              senderId: userId,
            },
            {
              chatId: {
                in: allPersonalMsgChatIds,
              },
            },
          ],
        },
      });

      await tx.groupAdmin.deleteMany({
        where: {
          adminId: userId,
        },
      });

      await tx.chatKey.deleteMany({
        where: {
          OR: [
            {
              userId,
            },
            {
              chatId: {
                in: allPersonalMsgChatIds,
              },
            },
          ],
        },
      });

      await tx.participants.deleteMany({
        where: {
          OR: [
            {
              userId,
            },
            {
              chatId: {
                in: allPersonalMsgChatIds,
              },
            },
          ],
        },
      });

      // delete all personal chats
      await tx.chat.deleteMany({
        where: {
          chatId: {
            in: allPersonalMsgChatIds,
          },
        },
      });

      await tx.user.delete({
        where: {
          userId,
        },
      });
    });

    await Promise.all([
      clearFromRedis({
        key: allAssociatedChatParticipantIds.map((id) => `chats:${id}`),
      }),
      clearFromRedis({
        key: allAssociatedGroupIds?.map((id) => `group:${id}:${userId}`),
      }),
      clearFromRedis({
        key: allAssociatedChatIds?.map((id) => `messages:${id}`),
      }),
      clearFromRedis({
        key: allAssociatedChatIds?.map((id) => `chatKey:${userId}:${id}`),
      }),
      clearFromRedis({
        key: allPersonalMsgChatIds.flatMap((chatId) =>
          allPersonalMsgParticipantIds.map(
            (userId) => `chatKey:${userId}:${chatId}`
          )
        ),
      }),
      clearFromRedis({
        pattern: `userid_not:${userId}:*`,
      }),
      clearFromRedis({ key: `socket:${userId}` }),
      setDataAsSetInRedis({
        key: "blacklistedTokens",
        data: [accesstoken, refreshtoken],
        isString: true,
      }),
    ]);

    res.clearCookie("accesstoken");
    res.clearCookie("refreshtoken");

    return res.status(200).json({
      message: "account_deleted_successfully",
    });
  } catch (error) {
    console.log("error_in_delete_account", error);
    return res.status(500).json(error);
  }
};

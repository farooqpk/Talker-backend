import { ContentType } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { clearFromRedis } from "../../redis";
import { SocketEvents } from "../../events";
import { SocketHandlerParams } from "../../types/common";

type GroupMsgType = {
  groupId: string;
  message: {
    content?: string;
    contentType: ContentType;
    mediaPath?: string;
  };
};

export const sendGroupMsgHandler = async (
  { io, payload }: SocketHandlerParams,
  { groupId, message }: GroupMsgType
) => {
  const { content, contentType, mediaPath } = message;

  const IS_IMAGE_OR_AUDIO =
    contentType === ContentType.IMAGE || contentType === ContentType.AUDIO;

  if ((!IS_IMAGE_OR_AUDIO && !content) || (IS_IMAGE_OR_AUDIO && !mediaPath)) {
    return;
  }

  const isUserExistInGroup = await prisma.group.findFirst({
    where: {
      groupId,
      Chat: {
        participants: {
          some: {
            userId: payload.userId,
          },
        },
      },
    },
    select: {
      chatId: true,
      Chat: {
        select: {
          participants: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });
  if (!isUserExistInGroup) return;

  const msg = await prisma.message.create({
    data: {
      chatId: isUserExistInGroup.chatId,
      contentType,
      content: !IS_IMAGE_OR_AUDIO ? content : null,
      mediaPath: IS_IMAGE_OR_AUDIO ? mediaPath : null,
      createdAt: new Date(),
      senderId: payload.userId,
    },
    include: {
      sender: {
        select: {
          userId: true,
          username: true,
        },
      },
    },
  });

  // clear the message cache
  const groupMembers = isUserExistInGroup.Chat.participants;
  await Promise.all([
    clearFromRedis({
      key: `messages:${isUserExistInGroup.chatId}`,
    }),
    clearFromRedis({
      key: groupMembers.map((item) => `chats:${item.userId}`),
    }),
  ]);

  io.to(groupId).emit(SocketEvents.SEND_GROUP_MESSAGE, { message: msg });
};

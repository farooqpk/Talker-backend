import { ContentType } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { IO_SERVER, SOCKET_PAYLOAD } from "../../utils/configureSocketIO";
import { clearFromRedis } from "../../redis";
import { SocketEvents } from "../../events";

type GroupMsgType = {
  groupId: string;
  message: {
    content?: string;
    contentType: ContentType;
    mediaPath?: string;
  };
};

export const sendGroupMsgHandler = async ({
  groupId,
  message,
}: GroupMsgType) => {
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
            userId: SOCKET_PAYLOAD.userId,
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
      content:!IS_IMAGE_OR_AUDIO ? content : null,
      createdAt: new Date(),
      senderId: SOCKET_PAYLOAD.userId,
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

  IO_SERVER.to(groupId).emit(SocketEvents.SEND_GROUP_MESSAGE, { message: msg });
};

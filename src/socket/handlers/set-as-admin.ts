import { SocketEvents } from "../../events";
import { clearFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";
import msgpack from "msgpack-lite";

type SetAsAdmin = {
  groupId: string;
  userId: string;
};

export const setAsAdminHandler = async (
  { io, payload, socket }: SocketHandlerParams,
  data: Buffer
) => {
  const { groupId, userId } = msgpack.decode(data) as SetAsAdmin;
  const group = await prisma.group.findUnique({
    where: {
      groupId,
      GroupAdmin: {
        some: {
          AND: [
            {
              adminId: payload.userId,
            },
            {
              adminId: {
                not: userId,
              },
            },
          ],
        },
      },
    },
  });

  if (!group) {
    socket.emit(
      SocketEvents.ERROR,
      msgpack.encode({
        message:
          "You are not admin of this group or the new admin already is the admin of the group",
      })
    );
    return;
  }

  await prisma.groupAdmin.create({
    data: {
      groupId,
      adminId: userId,
      createdAt: new Date(),
    },
  });

  const members = await prisma.participants.findMany({
    where: {
      chatId: group.chatId,
    },
    select: {
      userId: true,
    },
  });

  await Promise.all(
    members.map(({ userId }) => {
      clearFromRedis({
        key: [`chats:${userId}`, `group:${groupId}:${userId}`],
      });
    })
  );

  io.to(groupId).emit(SocketEvents.SET_ADMIN, userId);
};

import { AppEvents, SocketEvents } from "../../events";
import { clearFromRedis, getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";
import msgpack from "msgpack-lite";

type AddNewMembersToGroup = {
  groupId: string;
  members: {
    userId: string;
    encryptedKey: string;
  }[];
};

export const addNewMembersToGroupHandler = async (
  { socket, payload, io }: SocketHandlerParams,
  data: Buffer
) => {
  const { groupId, members } = msgpack.decode(data) as AddNewMembersToGroup;
  const adminId = payload.userId;

  const group = await prisma.group.findUnique({
    where: {
      groupId,
      GroupAdmin: {
        some: {
          adminId,
        },
      },
    },
  });

  if (!group) return;

  const chatId = group.chatId;

  await prisma.$transaction(async (tx) => {
    await tx.participants.createMany({
      data: members.map(({ userId }) => ({
        chatId,
        userId,
        createdAt: new Date(),
      })),
    });

    await tx.chatKey.createMany({
      data: members.map(({ userId, encryptedKey }) => ({
        chatId,
        userId,
        encryptedKey,
      })),
    });
  });

  // all the members
  const allMembers = await prisma.participants.findMany({
    where: {
      chatId,
    },
    select: {
      userId: true,
    },
  });

  // clear all the members chat cache
  await Promise.all(
    allMembers.map(({ userId }) => {
      clearFromRedis({
        key: [`chats:${userId}`, `group:${groupId}:${userId}`],
      });
    })
  );

  // nautification to all existing members regarding new members
  io.to(groupId).emit(SocketEvents.ADD_NEW_MEMBER_TO_GROUP);

  // nautification to new members
  const newMembersSocket = await Promise.all(
    members.map(({ userId }) => getDataFromRedis(`socket:${userId}`, true))
  );

  const validSockets = newMembersSocket.filter((socketId) => socketId);

  io.to(validSockets).emit(AppEvents.GROUP_CREATED);
};

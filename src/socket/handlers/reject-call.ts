import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";

export const rejectCallHandler = async (
  { io, payload }: SocketHandlerParams,
  opponentId: string
) => {
  const socketId = await getDataFromRedis(`socket:${opponentId}`, true);

  if (socketId && opponentId !== payload.userId) {
    io.to(socketId).emit(SocketEvents.REJECT_CALL);
  }
};

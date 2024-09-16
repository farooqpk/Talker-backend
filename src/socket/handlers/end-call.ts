import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import { prisma } from "../../utils/prisma";

export const endCallHandler = async (
  { io, payload }: SocketHandlerParams,
  opponentId: string
) => {
  const socketId = await getDataFromRedis(`socket:${opponentId}`, true);

  if (socketId && opponentId !== payload.userId) {
    io.to(socketId).emit(SocketEvents.END_CALL);
  }
};

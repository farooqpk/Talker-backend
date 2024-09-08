import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";

export const endCallHandler = async (
  { io, payload }: SocketHandlerParams,
  opponentId: string | null
) => {
  const socketId = await getDataFromRedis(`socket:${opponentId}`, true);

  if (socketId && opponentId !== payload.userId) {
    io.to(socketId).emit(SocketEvents.END_CALL);
  }
};

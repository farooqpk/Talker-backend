import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";

export const rejectCallHandler = async (
  { io, payload }: SocketHandlerParams,
  opponentId: string | null
) => {
  const socketId = await getDataFromRedis(`socket:${opponentId}`, true);

  if (socketId && opponentId !== payload.userId) {
    io.to(socketId).emit(SocketEvents.REJECT_CALL);
  }
};

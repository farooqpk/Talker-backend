import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";

type Args = {
  toUserId: string;
};

export const isTypingHandler = async (
  { io, payload, socket }: SocketHandlerParams,
  { toUserId }: Args
) => {
  const socketId = await getDataFromRedis(`socket:${toUserId}`, true);

  if (socketId && toUserId !== payload.userId) {
    socketId && io.to(socketId).emit(SocketEvents.IS_TYPING, payload.userId);
  }
};

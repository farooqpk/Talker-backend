import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";
import msgpack from "msgpack-lite";

type Args = {
  toUserId: string;
};

export const isNotTypingHandler = async (
  { io, payload, socket }: SocketHandlerParams,
  data: Buffer
) => {
  const { toUserId } = msgpack.decode(data) as Args;
  const socketId = await getDataFromRedis(`socket:${toUserId}`, true);

  if (socketId && toUserId !== payload.userId) {
    socketId &&
      io.to(socketId).emit(SocketEvents.IS_NOT_TYPING, payload.userId);
  }
};

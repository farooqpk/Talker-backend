import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";

export const isOnlineHandler = async (
  { socket, io, payload }: SocketHandlerParams,
  userId: string
) => {
  const socketId = await getDataFromRedis(`socket:${userId}`, true);
  if (socketId) {
    socket.emit(SocketEvents.IS_ONLINE, "online");
  } else {
    socket.emit(SocketEvents.IS_ONLINE, "offline");
  }
};

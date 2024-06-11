import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SOCKET } from "../../utils/configureSocketIO";

export const isOnlineHandler = async (userId: string) => {
  const socketId = await getDataFromRedis(`socket:${userId}`, true);
  if (socketId) {
    SOCKET.emit(SocketEvents.IS_ONLINE, "online");
  } else {
    SOCKET.emit(SocketEvents.IS_ONLINE, "offline");
  }
};

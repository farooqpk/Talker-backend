import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { IO_SERVER, SOCKET_PAYLOAD } from "../../utils/configureSocketIO";

export const isNotTypingHandler = async ({
  toUserId,
}: {
  toUserId: string;
}) => {
  const socketId = await getDataFromRedis(`socket:${toUserId}`, true);

  if (socketId && toUserId !== SOCKET_PAYLOAD.userId) {
    socketId &&
      IO_SERVER.to(socketId).emit(
        SocketEvents.IS_NOT_TYPING,
        SOCKET_PAYLOAD.userId
      );
  }
};

import { AppEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";

export const groupCreatedHandler = async (
  { io }: SocketHandlerParams,
  users: string[]
) => {
  const usersSocket = await Promise.all(
    users.map((user) => getDataFromRedis(`socket:${user}`, true))
  )

  const validSockets = usersSocket.filter(socketId => socketId);
  io.to(validSockets).emit(AppEvents.GROUP_CREATED);
};

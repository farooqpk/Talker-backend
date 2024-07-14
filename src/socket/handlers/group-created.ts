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
  // let usersSocket: string[] = [];
  // for (let i = 0; i < users.length; i++) {
  //   const socketId = await getDataFromRedis(`socket:${users[i]}`, true);
  //   if (socketId) {
  //     usersSocket.push(socketId);
  //   }
  // }
  io.to(validSockets).emit(AppEvents.GROUP_CREATED);
};

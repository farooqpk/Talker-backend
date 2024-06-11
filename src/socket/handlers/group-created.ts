import { AppEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { IO_SERVER } from "../../utils/configureSocketIO";

export const groupCreatedHandler = async (users: string[]) => {
  let usersSocket: string[] = [];
  for (let i = 0; i < users.length; i++) {
    const socketId = await getDataFromRedis(`socket:${users[i]}`, true);
    if (socketId) {
      usersSocket.push(socketId);
    }
  }
  IO_SERVER.to(usersSocket).emit(AppEvents.GROUP_CREATED);
};

import { verifyJwt } from "./verifyJwt";
import { Server } from "socket.io";
import { socketHandler } from "../socket/socketHandler";
import { clearFromRedis, setDataInRedis } from "../redis";

export function configureSocketIO(io: Server) {
  io.on("connection", async (socket) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.error("Socket.IO: Access token not found");
      socket.emit("unauthorized", "Access token not found");
      socket.disconnect(true);
      return;
    }
    try {
      const payload = await verifyJwt(token);
      console.log("Socket.IO: Connection successful");
      await setDataInRedis({
        key: `socket:${payload.userId}`,
        data: socket.id,
        isString: true,
      });
      socket.broadcast.emit("isConnected", payload.userId);
      socketHandler(socket, io, payload);
      socket.on("disconnect", async () => {
        socket.rooms.forEach((room) => socket.leave(room));
        await clearFromRedis({ key: `socket:${payload.userId}` });
        socket.broadcast.emit("isDisconnected", payload.userId);
        console.log("Socket.IO: Disconnected");
      });
    } catch (error) {
      console.error("Socket.IO: Authentication failed", error);
      return socket.disconnect(true);
    }
  });
}

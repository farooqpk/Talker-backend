import { verifyJwt } from "./verifyJwt";
import { Server } from "socket.io";
import { socketHandler } from "../socket/socketHandler";
import { clearFromRedis, setDataInRedis } from "../redis";

export function configureSocketIO(io: Server) {
  io.on("connection", async (socket) => {
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
      console.error("Socket.IO: No cookies found");
      socket.emit("unauthorized", "No cookies found");
      socket.disconnect(true);
      return;
    }

    const tokenMatch = cookies.match(/accesstoken=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      console.error("Socket.IO: Access token not found");
      socket.emit("unauthorized", "Access token not found");
      socket.disconnect(true);
      return;
    }

    try {
      const payload = await verifyJwt(token);

      if (!payload) {
        console.error("Socket.IO: Access token not valid");
        socket.emit("unauthorized", "Access token not valid");
        socket.disconnect(true);
        return;
      }

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
      socket.emit("unauthorized", "Authentication failed");
      socket.disconnect(true);
    }
  });
}

import { verifyJwt } from "./verifyJwt";
import { Server } from "socket.io";
import { socketHandler } from "../socket";
import { clearFromRedis, setDataInRedis } from "../redis";
import { SocketEvents } from "../events";

export function configureSocketIO(io: Server) {
  io.on(SocketEvents.CONNECTION, async (socket) => {
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
      console.error("Socket.IO: No cookies found");
      socket.emit(SocketEvents.UN_AUTHORIZED, "No cookies found");
      socket.disconnect(true);
      return;
    }

    const tokenMatch = cookies.match(/accesstoken=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      console.error("Socket.IO: Access token not found");
      socket.emit(SocketEvents.UN_AUTHORIZED, "Access token not found");
      socket.disconnect(true);
      return;
    }

    try {
      const payload = await verifyJwt(token);

      if (!payload) {
        console.error("Socket.IO: Access token not valid");
        socket.emit(SocketEvents.UN_AUTHORIZED, "Access token not valid");
        socket.disconnect(true);
        return;
      }

      console.log("Socket.IO: Connection successful");

      await setDataInRedis({
        key: `socket:${payload.userId}`,
        data: socket.id,
        isString: true,
      });
      socket.broadcast.emit(SocketEvents.IS_CONNECTED, payload.userId);

      // Socket handler
      socketHandler(socket, io, payload);

      socket.on(SocketEvents.DISCONNECT, async () => {
        socket.rooms.forEach((room) => socket.leave(room));
        await clearFromRedis({
          key: [`socket:${payload.userId}`, `peer:${payload.userId}`],
        });
        socket.broadcast.emit(SocketEvents.IS_DISCONNECTED, payload.userId);
        console.log(`Socket.IO: ${payload.username} disconnected`);
      });
    } catch (error) {
      console.error("Socket.IO: Authentication failed", error);
      socket.emit(SocketEvents.UN_AUTHORIZED, "Authentication failed");
      socket.disconnect(true);
    }
  });
}

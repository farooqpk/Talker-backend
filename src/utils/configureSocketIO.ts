import { verifyJwt } from "./verifyJwt";
import { Server } from "socket.io";
import { socketHandler } from "../socket/socketHandler";
import { ONLINE_USERS_SOCKET } from "..";

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
      ONLINE_USERS_SOCKET.set(payload.userId, socket.id);
      socket.broadcast.emit("isConnected", payload.userId);
      socketHandler(socket, io, payload);
      socket.on("disconnect", () => {
        socket.rooms.forEach((room) => socket.leave(room));
        ONLINE_USERS_SOCKET.delete(payload.userId);
        socket.broadcast.emit("isDisconnected", payload.userId);
        console.log("Socket.IO: Disconnected");
      });
    } catch (error) {
      console.error("Socket.IO: Authentication failed", error);
      return socket.disconnect(true);
    }
  });
}

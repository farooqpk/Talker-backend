import express, { Express, urlencoded } from "express";
import cors from "cors";
import { router } from "./routes/route";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server, Socket } from "socket.io";
import { socketHandler } from "./socket/socketHandler";
import { connectPrisma } from "./utils/prisma";
import { verifyJwt } from "./utils/verifyJwt";
import { EventEmitter } from "events";
dotenv.config();

const app: Express = express();
const server = http.createServer(app);

app.use(
  (cors as (options: cors.CorsOptions) => express.RequestHandler)({
    // origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/", router);
app.use(urlencoded({ extended: true }));

const io: Server = new Server(server, {
  cors: {
    // origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

export const ONLINE_USERS_SOCKET: Map<string, string> = new Map();

export const eventEmitter = new EventEmitter();

io.on("connection", async (socket: Socket) => {
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

server.listen(process.env.PORT!, async () => {
  console.log("server connected");
  await connectPrisma();
});

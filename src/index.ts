import express, { Express, Request, Response, urlencoded } from "express";
import cors from "cors";
import { router } from "./routes/route";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server, Socket } from "socket.io";
import { socketHandler } from "./socket/socketHandler";
import { connectPrisma } from "./utils/prisma";
import { verifyJwt } from "./utils/verifyJwt";
dotenv.config();

const app: Express = express();
const server = http.createServer(app);

app.use(
  (cors as (options: cors.CorsOptions) => express.RequestHandler)({
    origin: true,
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/", router);
app.use(urlencoded({ extended: true }));

const io: Server = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

export const ONLINE_USERS: Map<string, string> = new Map();

io.on("connection", async (socket: Socket) => {
  const tokens = socket.request.headers.cookie;

  if (!tokens || !tokens.includes("accesstoken")) {
    console.error("Socket.IO: Access token not found in headers");
    // Handle the lack of access token (maybe emit an event or disconnect)
    return socket.disconnect(true);
  }

  try {
    const payload = await verifyJwt(tokens);
    console.log("Socket.IO: Connection successful");
    ONLINE_USERS.set(payload.userId, socket.id);
    socket.broadcast.emit("isConnected", payload.userId);
    socketHandler(socket, io, payload);
    socket.on("disconnect", () => {
      ONLINE_USERS.delete(payload.userId);
      socket.broadcast.emit("isDisconnected", payload.userId);
      console.log("Socket.IO: Disconnected");
    });
  } catch (error) {
    console.error("Socket.IO: Authentication failed", error);
    // Handle authentication failure (maybe emit an event or disconnect)
    return socket.disconnect(true);
  }
});

server.listen(process.env.PORT!, async () => {
  console.log("server connected");
  await connectPrisma();
});

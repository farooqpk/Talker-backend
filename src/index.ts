import express, { Express, Request, Response, urlencoded } from "express";
import cors from "cors";
import { router } from "./routes/route";
import dotenv from "dotenv";
import mongoose from "mongoose";
import * as Redis from "redis";
import cookieParser from "cookie-parser";
import http from "http";
import { Server, Socket } from "socket.io";
import { socketHandler } from "./socket/socketHandler";
import { verifyJwt } from "./helpers/verifyJwt";
dotenv.config();

const app: Express = express();
const server = http.createServer(app);

export const RedisClient = Redis.createClient();

app.use(
  (cors as (options: cors.CorsOptions) => express.RequestHandler)({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/", router);
app.use(urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response): void => {
  res.send("hello from server");
});

//socket io
const io: Server = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});
io.on("connection", (socket: Socket) => {
  const token = socket.request.headers.cookie;
  if (token) {
    verifyJwt(token)
      .then((userId) => {
        socketHandler(socket, io,userId);
      })
      .catch((e) => {
        io.close()
      });
  }
});

// connections
mongoose.connect(process.env.DB_URL!).then(() => {
  console.log("mongodb connected");
  RedisClient.connect().then(() => {
    console.log("redis connected");
    server.listen(process.env.PORT, () => {
      console.log("server connected");
    });
  });
});

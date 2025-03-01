import express, { Express } from "express";
import dotenv from "dotenv";
import http from "node:http";
import { Server } from "socket.io";
import { connectPrisma } from "./utils/prisma";
import { EventEmitter } from "node:events";
import { connectToRedis } from "./utils/redis";
import { configureExpress } from "./utils/configureExpress";
import { configureSocketIO } from "./utils/configureSocketIO";
import { PORT } from "./config";
dotenv.config();

const app: Express = express();
export const server = http.createServer(app);

configureExpress(app);

export const io: Server = new Server(server,{
  transports: ["websocket"],
});

configureSocketIO(io);

export const eventEmitter = new EventEmitter();

server.listen(PORT || 5000, async () => {
  console.log(`Server listening on port ${PORT || 5000}`);
  await Promise.all([connectPrisma(),connectToRedis()])
});

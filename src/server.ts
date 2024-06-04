import express, { Express } from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { connectPrisma } from "./utils/prisma";
import { EventEmitter } from "events";
import { connectToRedis } from "./utils/redis";
import { configureExpress } from "./utils/configureExpress";
import { configureSocketIO } from "./utils/configureSocketIO";
import { PORT } from "./config";
dotenv.config();

const app: Express = express();
const server = http.createServer(app);

configureExpress(app);

const io: Server = new Server(server, {
  cors: {
    // origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

configureSocketIO(io);

export const eventEmitter = new EventEmitter();

server.listen(PORT || 5000, async () => {
  console.log(`Server listening on port ${PORT || 5000}`);
  await connectPrisma();
  await connectToRedis();
});

import express, { Express, Request, Response, urlencoded } from "express";
import cors from "cors";
import { router } from "./routes/route";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server, Socket } from "socket.io";
import { socketHandler } from "./socket/socketHandler";
import {connectPrisma} from "./utils/prisma";
import { verifyJwt } from "./utils/verifyJwt";
dotenv.config();

const app: Express = express();
const server = http.createServer(app);

app.use(
  (cors as (options: cors.CorsOptions) => express.RequestHandler)({
    origin:true,
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
      .then((payload) => {
        socketHandler(socket, io, payload);
      })
      .catch((e) => {
        io.close();
      });
  }
});

server.listen(process.env.PORT!, async() => {
  console.log("server connected");
  await connectPrisma()
});

import express, { Express, Request, Response, urlencoded } from "express";
import cors from "cors";
import { router } from "./routes/route";
import dotenv from "dotenv";
import mongoose from "mongoose";
import * as Redis from "redis";
dotenv.config();

const app: Express = express();

const RedisClient = Redis.createClient();

app.use(
  (cors as (options: cors.CorsOptions) => express.RequestHandler)({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
  })
);
app.use(express.json());
app.use("/", router);
app.use(urlencoded({ extended: false }));

app.get("/", (req: Request, res: Response): void => {
  res.send("hello from server");
});


// connections
mongoose.connect(process.env.DB_URL!).then(() => {
  RedisClient.connect().then(() => {
    app.listen(process.env.PORT, () => {
      console.log("server connected");
    });
  });
});

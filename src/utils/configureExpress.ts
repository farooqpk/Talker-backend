import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { authRouter } from "../routes/auth";
import { userRouter } from "../routes/user";
import { chatRouter } from "../routes/chat";
import { messageRouter } from "../routes/message";
import { groupRouter } from "../routes/group";
import cookieParser from "cookie-parser";
import { CLIENT_URL } from "../config";

export function configureExpress(app: express.Express) {
  app.use(cors({
    origin: CLIENT_URL, 
    credentials: true, 
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  // app.use(
  //   rateLimit({
  //     windowMs: 15 * 60 * 1000, // 15 minutes
  //     max: 150,
  //     standardHeaders: true,
  //     legacyHeaders: false,
  //   })
  // );

  // Routes
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/message", messageRouter);
  app.use("/api/group", groupRouter);
}

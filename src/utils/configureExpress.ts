import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { authRouter } from "../routes/auth";
import { userRouter } from "../routes/user";
import { chatRouter } from "../routes/chat";
import { messageRouter } from "../routes/message";
import { groupRouter } from "../routes/group";
import cookieParser from "cookie-parser";
import { aiRouter } from "../routes/ai";
import morgan from "morgan";
import { NODE_ENV } from "../config";

export function configureExpress(app: express.Express) {
  
  if (NODE_ENV === "production") {
    // Trust the first proxy (Nginx)
    app.set("trust proxy", 1);
    
    app.use(
      rateLimit({
        windowMs: 10 * 60 * 1000,
        max: 150,
        standardHeaders: true,
      })
    );

    app.use(morgan("common"));
  }

  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"], // Only allow resources from the same origin
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https:", "data:"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "wss:", "https:", "http:"], // Allow connections to same origin, WebSockets, and https
          objectSrc: ["'none'"], // Disallow embedding objects
          mediaSrc: ["'self'", "blob:"],
          frameSrc: ["'self'"],
          workerSrc: ["'self'", "blob:"],
        },
      },
    })
  );

  app.get("/api", (req, res) => res.send("Hello World!"));
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/message", messageRouter);
  app.use("/api/group", groupRouter);
  app.use("/api/ai", aiRouter);
}

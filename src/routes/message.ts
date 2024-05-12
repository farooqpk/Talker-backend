import Express, { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { messageList } from "../controllers/chat/messageList";

export const messageRouter: Router = Express.Router();

messageRouter.get("/messages/:chatId", verifyToken, messageList);

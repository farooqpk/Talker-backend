import Express, { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { messageList } from "../controllers/chat/messageList";
import { getMediaFromR2 } from "../controllers/chat/getMediaFromR2";

export const messageRouter: Router = Express.Router();

messageRouter.get("/messages/:chatId", verifyToken, messageList);

messageRouter.get("/get-media/:mediapath", verifyToken, getMediaFromR2);

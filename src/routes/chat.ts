import Express, { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { chatList } from "../controllers/chat/chatList";
import { getChatKey } from "../controllers/chat/getChatKey";
import { generateSignedUrl } from "../controllers/chat/generateSignedUrl";

export const chatRouter: Router = Express.Router();

chatRouter.get("/chat-list", verifyToken, chatList);

chatRouter.get("/get-chat-key/:chatId", verifyToken, getChatKey);

chatRouter.post("/get-signed-url", verifyToken, generateSignedUrl);

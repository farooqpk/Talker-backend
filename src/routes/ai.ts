import Express, { Router } from "express";
import { aiChat } from "../controllers/ai/aiChat";
import { verifyToken } from "../middlewares/verifyToken";
import { getAiChatHistory } from "../controllers/ai/getHistory";

export const aiRouter: Router = Express.Router();

aiRouter.post("/chat", verifyToken, aiChat);

aiRouter.get("/get-history", verifyToken, getAiChatHistory);

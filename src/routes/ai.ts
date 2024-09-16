import Express, { Router } from "express";
import { aiChat } from "../controllers/ai/aiChat";
import { verifyToken } from "../middlewares/verifyToken";

export const aiRouter: Router = Express.Router();

aiRouter.post("/chat", verifyToken, aiChat);

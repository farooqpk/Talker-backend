import Express, { Router } from "express";
import { signup } from "../controllers/auth/signup";
import { verifyRoute } from "../controllers/auth/verifyRoute";
import { verifyToken } from "../middlewares/verifyToken";
import { login } from "../controllers/auth/login";
import { createAccessTokenFromRefreshToken } from "../controllers/auth/refreshToken";
import { messageList } from "../controllers/chat/messageList";
import { searchUsers } from "../controllers/search/searchUser";

export const router: Router = Express.Router();

router.post("/auth/signup", signup);

router.post("/auth/login", login);

router.get("/auth/verifyRoute", verifyRoute);

router.post("/auth/refresh", createAccessTokenFromRefreshToken);

router.get("/getUsersForSearch", verifyToken, searchUsers);

router.get("/chat-list", verifyToken);

router.get("/messages/:chatId", verifyToken, messageList);

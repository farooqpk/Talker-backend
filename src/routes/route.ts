import Express, { Router } from "express";
import { signup } from "../controllers/auth/signup";
import { verifyRoute } from "../controllers/auth/verifyRoute";
import { verifyToken } from "../middlewares/verifyToken";
import { login } from "../controllers/auth/login";
import { createAccessTokenFromRefreshToken } from "../controllers/auth/refreshToken";
import { messageList } from "../controllers/chat/messageList";
import { searchUsers } from "../controllers/search/searchUser";
import { findUser } from "../controllers/user/findUser";
import { chatList } from "../controllers/chat/chatList";

export const router: Router = Express.Router();

router.post("/auth/signup", signup);

router.post("/auth/login", login);

router.get("/auth/verifyRoute", verifyRoute);

router.post("/auth/refresh", createAccessTokenFromRefreshToken);

router.get("/getUsersForSearch", verifyToken, searchUsers);

router.get("/user/:userId", verifyToken, findUser);

router.get("/chat-list", verifyToken,chatList);

router.get("/messages/:chatId", verifyToken, messageList);

import Express, { Router } from "express";
import { signup } from "../controllers/auth/signup";
import { verifyRoute } from "../controllers/auth/verifyRoute";
import { verifyToken } from "../middlewares/verifyToken";
import { login } from "../controllers/auth/login";
import { createAccessTokenFromRefreshToken } from "../controllers/auth/refreshToken";
import { updateUsername } from "../controllers/auth/updateUsername";

export const authRouter: Router = Express.Router();

authRouter.post("/signup", signup);

authRouter.post("/login", login);

authRouter.get("/verifyRoute", verifyRoute);

authRouter.post("/refresh", createAccessTokenFromRefreshToken);

authRouter.post("/update-username", verifyToken, updateUsername);

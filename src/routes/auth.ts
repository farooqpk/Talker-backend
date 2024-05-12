import Express, { Router } from "express";
import { signup } from "../controllers/auth/signup";
import { verifyRoute } from "../controllers/auth/verifyRoute";
import { verifyToken } from "../middlewares/verifyToken";
import { login } from "../controllers/auth/login";
import { createAccessTokenFromRefreshToken } from "../controllers/auth/refreshToken";
import { updateUsername } from "../controllers/auth/updateUsername";
import { validateData } from "../middlewares/validationMiddleware";
import {
  loginSchema,
  signupSchema,
  updateUsernameSchema,
} from "../schemas/authSchema";

export const authRouter: Router = Express.Router();

authRouter.post("/signup", validateData(signupSchema), signup);

authRouter.post("/login", validateData(loginSchema), login);

authRouter.get("/verifyRoute", verifyRoute);

authRouter.post("/refresh", createAccessTokenFromRefreshToken);

authRouter.post(
  "/update-username",
  [verifyToken, validateData(updateUsernameSchema)],
  updateUsername
);

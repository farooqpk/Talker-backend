import Express, { Router } from "express";
import { login } from "../controllers/auth/login";

export const router: Router = Express.Router();

router.post("/login", login);

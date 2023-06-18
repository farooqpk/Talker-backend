import Express, { Router } from "express";
import { signup } from "../controllers/auth/signup";
import { isUserAlreadyExistOrNot } from "../controllers/auth/isUserAlreadyExistOrNot";

export const router: Router = Express.Router();

router.post("/isUserAlreadyExist",isUserAlreadyExistOrNot)

router.post("/signup", signup);

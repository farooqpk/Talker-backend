import Express, { Router } from "express";
import { signup } from "../controllers/auth/signup";
import { isUserAlreadyExistOrNot } from "../controllers/auth/isUserAlreadyExistOrNot";
import { verifyRoute } from "../controllers/auth/verifyRoute";
import {getRandomUsers} from "../controllers/search/getRandomUsers";

export const router: Router = Express.Router();

router.post("/isUserAlreadyExist",isUserAlreadyExistOrNot)

router.post("/signup", signup);

router.get("/verifyRoute",verifyRoute)

router.get("/getRandomUsersForSearch",getRandomUsers)

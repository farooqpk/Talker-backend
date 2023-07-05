import Express, { Router } from "express";
import { signup } from "../controllers/auth/signup";
import { isUserAlreadyExistOrNot } from "../controllers/auth/isUserAlreadyExistOrNot";
import { verifyRoute } from "../controllers/auth/verifyRoute";
import { getRandomUsers } from "../controllers/search/getRandomUsers";
import { verifyToken } from "../middlewares/verifyToken";
import { searchUser } from "../controllers/search/searchUser";

export const router: Router = Express.Router();

router.post("/isUserAlreadyExist", isUserAlreadyExistOrNot);

router.post("/signup", signup);

router.get("/verifyRoute", verifyRoute);

router.get("/getRandomUsersForSearch", verifyToken, getRandomUsers);

router.get("/searchUser", verifyToken, searchUser);

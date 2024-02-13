import Express, { Router } from "express";
import { signup } from "../controllers/auth/signup";
import { verifyRoute } from "../controllers/auth/verifyRoute";
import { getRandomUsers } from "../controllers/search/getRandomUsers";
import { verifyToken } from "../middlewares/verifyToken";
import { searchUser } from "../controllers/search/searchUser";
import { login } from "../controllers/auth/login";

export const router: Router = Express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.get("/verifyRoute", verifyRoute);

router.get("/getRandomUsersForSearch", verifyToken, getRandomUsers);

router.get("/searchUser", verifyToken, searchUser);

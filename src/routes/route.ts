import Express, { Router } from "express";
import { signup } from "../controllers/auth/signup";
import { verifyRoute } from "../controllers/auth/verifyRoute";
import { getRandomUsers } from "../controllers/search/getRandomUsers";
import { verifyToken } from "../middlewares/verifyToken";
import { searchUser } from "../controllers/search/searchUser";
import { login } from "../controllers/auth/login";
import { createAccessTokenFromRefreshToken } from "../controllers/auth/refreshToken";

export const router: Router = Express.Router();

router.get("/", verifyToken, (req, res) => {
  res.send("hello from server");
});
router.post("/auth/signup", signup);

router.post("/auth/login", login);

router.get("/auth/verifyRoute", verifyRoute);

router.post("/auth/refresh", createAccessTokenFromRefreshToken);

router.get("/getRandomUsersForSearch", verifyToken, getRandomUsers);

router.get("/searchUser", verifyToken, searchUser);

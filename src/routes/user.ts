import Express, { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { searchUsers } from "../controllers/search/searchUser";
import { findUser } from "../controllers/user/findUser";
import { findPublicKeys } from "../controllers/chat/findPublicKeys";

export const userRouter: Router = Express.Router();

userRouter.get("/getUsersForSearch", verifyToken, searchUsers);

userRouter.get("/:userId", verifyToken, findUser);

userRouter.post("/get-public-keys", verifyToken, findPublicKeys);

userRouter.delete("/delete-account",verifyToken)

userRouter.get("/is-any-group-admin/:userId",verifyToken)
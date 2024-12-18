import Express, { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { searchUsers } from "../controllers/search/searchUser";
import { findUser } from "../controllers/user/findUser";
import { findPublicKeys } from "../controllers/chat/findPublicKeys";
import { isAnyGroupAdmin } from "../controllers/user/is-any-group-admin";
import { deleteAccount } from "../controllers/user/deleteAccount";

export const userRouter: Router = Express.Router();

userRouter.get("/getUsersForSearch", verifyToken, searchUsers);

userRouter.get("/:userId", verifyToken, findUser);

userRouter.get("/is-any-group-admin/:userId", verifyToken, isAnyGroupAdmin);

userRouter.post("/get-public-keys", verifyToken, findPublicKeys);

userRouter.delete("/delete-account", verifyToken, deleteAccount);

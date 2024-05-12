import Express, { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { createGroup } from "../controllers/group/createGroup";
import { groupDetails } from "../controllers/group/groupDetails";

export const groupRouter: Router = Express.Router();

groupRouter.post("/create-group", verifyToken, createGroup);

groupRouter.get("/:groupId", verifyToken, groupDetails);

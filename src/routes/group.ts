import Express, { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { createGroup } from "../controllers/group/createGroup";
import { groupDetails } from "../controllers/group/groupDetails";
import { validateData } from "../middlewares/validationMiddleware";
import { createGroupSchema } from "../schemas/groupSchema";

export const groupRouter: Router = Express.Router();

groupRouter.post(
  "/create-group",
  [verifyToken, validateData(createGroupSchema)],
  createGroup
);

groupRouter.get("/:groupId", verifyToken, groupDetails);

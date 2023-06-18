import jwt from "jsonwebtoken";
import {Types} from "mongoose";

type IdType = Types.ObjectId;

export const createJwtToken = (userId: IdType): string => {
  return jwt.sign({ userId }, process.env.TOKEN_SECRET!, { expiresIn: "1hr" })
};

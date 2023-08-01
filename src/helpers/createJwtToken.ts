import jwt from "jsonwebtoken";
import {Types} from "mongoose";

type IdType = Types.ObjectId;

export const createJwtToken = (userId: IdType,username:string): string => {
  return jwt.sign({ userId,username }, process.env.TOKEN_SECRET!, { expiresIn: "12hr" })
};

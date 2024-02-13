import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

export const createJwtToken = (userId: Prisma.UserCreateInput["userId"],username:string): string => {
  return jwt.sign({ userId,username }, process.env.TOKEN_SECRET!, { expiresIn: "12hr" })
};

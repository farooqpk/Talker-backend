import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../config";

export const createJwtToken = (
  userId: Prisma.UserCreateInput["userId"],
  username: string,
  publicKey: string,
  tokenType: "access" | "refresh"
): string => {
  return jwt.sign(
    { userId, username, publicKey },
    tokenType === "access" ? ACCESS_TOKEN_SECRET! : REFRESH_TOKEN_SECRET!,
    {
      expiresIn: tokenType === "access" ? "1h" : "7d",
    }
  );
};

import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";

export const createJwtToken = (
  userId: Prisma.UserCreateInput["userId"],
  username: string,
  tokenType: "access" | "refresh"
): string => {
  return jwt.sign(
    { userId, username },
    tokenType === "access"
      ? process.env.ACCESS_TOKEN_SECRET!
      : process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: tokenType === "access" ? "1h" : "7d",
    }
  );
};

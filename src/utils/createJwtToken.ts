import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../config";

export const createJwtToken = (
  userId: string,
  username: string,
  publicKey: string,
  tokenType: "access" | "refresh"
): string => {
  return jwt.sign(
    { userId, username, publicKey },
    tokenType === "access" ? ACCESS_TOKEN_SECRET! : REFRESH_TOKEN_SECRET!,
    {
      expiresIn:
        tokenType === "access"
          ? `${ACCESS_TOKEN_EXPIRY}h`
          : `${REFRESH_TOKEN_EXPIRY}d`,
    }
  );
};

import jwt from "jsonwebtoken";
import { DecodedPayload } from "../types/DecodedPayload";
import { ACCESS_TOKEN_SECRET } from "../config";
import { checkItemInSetRedis } from "../redis/check-Item-In-set";

export const verifyJwt = async (value: string) => {
  try {
    const isBlacklisted = await checkItemInSetRedis("blacklistedTokens", value);

    if (isBlacklisted) {
      throw new Error("Token is blacklisted");
    }

    const decodedData = jwt.verify(
      value,
      ACCESS_TOKEN_SECRET!
    ) as DecodedPayload;

    if (!decodedData) {
      throw new Error("Invalid token or token cannot be decoded");
    }

    return {
      userId: decodedData.userId,
      username: decodedData.username,
      publicKey: decodedData.publicKey,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

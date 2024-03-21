import jwt from "jsonwebtoken";
import { DecodedPayload } from "../types/DecodedPayload";

export const verifyJwt = async (value: string) => {
  try {
    const decodedData = jwt.verify(
      value,
      process.env.ACCESS_TOKEN_SECRET!
    ) as DecodedPayload;

    if (decodedData) {
      return { userId: decodedData.userId, username: decodedData.username };
    } else {
      throw new Error("Invalid token or token cannot be decoded");
    }
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

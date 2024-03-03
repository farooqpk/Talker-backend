import jwt from "jsonwebtoken";
import { DecodedPayload } from "../types/DecodedPayload";

export const verifyJwt = async (value: string) => {
  try {
    // Step 1: Split by semicolon
    const tokenPairs = value.split(";");

    // Step 2: Find the pair with "accesstoken"
    const accessTokenPair = tokenPairs.find((pair) =>
      pair.includes("accesstoken")
    );

    if (accessTokenPair) {
      // Step 3: Extract the token value
      const accessToken = accessTokenPair.split("=")[1].trim();

      const decodedData = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET!
      ) as DecodedPayload;

      if (decodedData) {
        return { userId: decodedData.userId, username: decodedData.username };
      } else {
        throw new Error("Invalid token or token cannot be decoded");
      }
    } else {
      console.error("Access token not found in the string");
      throw new Error("Access token not found in the string");
    }
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

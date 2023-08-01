import jwt from "jsonwebtoken";
import { JwtDecodedType } from "../types/UserData";

export const verifyJwt = async (value: string) => {
  try {
    const token = value.split("=")[1];
    const decodedData = jwt.verify(
      token,
      process.env.TOKEN_SECRET!
    ) as JwtDecodedType;
    if (decodedData) {
      return decodedData.userId
    } else {
      throw new Error("Invalid token or token cannot be decoded");
    }
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

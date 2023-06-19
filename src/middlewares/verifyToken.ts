import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../types/UserData";
import jwt from "jsonwebtoken";

export const verifyToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(404)
        .json({ success: false, message: "token is required" });
    }

    const decodedData = jwt.verify(token, process.env.TOKEN_SECRET!);
    if (decodedData) {
      req.userId = decodedData as string;
      next();
    } else {
      return res
        .status(401)
        .json({ success: false, message: "token is invalid" });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "there is an error while verifying user",
    });
  }
};

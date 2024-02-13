import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import { JwtDecodedType } from "../types/UserData";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = (req.headers as any)?.cookie?.split("=")[1];
    if (!token) {
      return res
        .status(404)
        .json({ success: false, message: "token is required" });
    }

    const decodedData = jwt.verify(
      token,
      process.env.TOKEN_SECRET!
    ) as JwtDecodedType;
    if (decodedData) {
      req.userId = decodedData.userId;
      req.username = decodedData.username;
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

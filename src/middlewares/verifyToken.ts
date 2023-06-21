import { NextFunction, Response } from "express";
import { ReqObjWithUserId } from "../types/ReqObjWithUserId";
import jwt, { decode } from "jsonwebtoken";

export const verifyToken = async (
  req: ReqObjWithUserId,
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

    jwt.verify(token, process.env.TOKEN_SECRET!, (err, decodedData) => {
      if (err) {
        return res
          .status(401)
          .json({ success: false, message: "token is invalid" });
      } else {
        console.log(decodedData);
        req.userId = decodedData as string;
        next();
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "there is an error while verifying user",
    });
  }
};

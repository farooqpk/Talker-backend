import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import { DecodedPayload } from "../types/DecodedPayload";
import { ACCESS_TOKEN_SECRET } from "../config";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "token is missing" });

  try {
    const tokenDecoded = jwt.verify(
      token,
      ACCESS_TOKEN_SECRET!
    ) as DecodedPayload;
    if (tokenDecoded) {
      req.userId = tokenDecoded.userId;
      req.username = tokenDecoded.username;
      next();
    } else {
      return res
        .status(401)
        .json({ success: false, message: "token is invalid" });
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

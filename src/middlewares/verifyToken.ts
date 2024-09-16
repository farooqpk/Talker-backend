import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import { DecodedPayload } from "../types/DecodedPayload";
import { ACCESS_TOKEN_SECRET } from "../config";
import { checkItemInSetRedis } from "../redis/check-Item-In-set";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accesstoken = req.cookies.accesstoken;

  if (!accesstoken)
    return res
      .status(401)
      .json({ success: false, message: "token is missing" });

  try {
    const isBlacklisted = await checkItemInSetRedis(
      "blacklistedTokens",
      accesstoken
    );

    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "token is blacklisted",
      });
    }

    const tokenDecoded = jwt.verify(
      accesstoken,
      ACCESS_TOKEN_SECRET!
    ) as DecodedPayload;

    if (!tokenDecoded) {
      return res
        .status(401)
        .json({ success: false, message: "token is invalid" });
    }

    req.userId = tokenDecoded.userId;
    req.username = tokenDecoded.username;
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

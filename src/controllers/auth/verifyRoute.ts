import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DecodedPayload } from "../../types/DecodedPayload";
import { ACCESS_TOKEN_SECRET } from "../../config";
import { checkItemInSetRedis } from "../../redis/check-Item-In-set";

export const verifyRoute = async (req: Request, res: Response) => {
  const accesstoken = req.cookies.accesstoken;

  if (!accesstoken) {
    return res
      .status(401)
      .json({ success: false, message: "token is missing" });
  }

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
    return res.status(200).json({
      success: true,
      message: "token is valid",
      payload: {
        userId: tokenDecoded.userId,
        username: tokenDecoded.username,
        publicKey: tokenDecoded.publicKey,
      },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(401)
      .json({ success: false, message: "token is invalid" });
  }
};

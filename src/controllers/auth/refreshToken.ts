import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createJwtToken } from "../../utils/createJwtToken";
import { NODE_ENV, REFRESH_TOKEN_SECRET } from "../../config";
import dayjs from "dayjs";
import { checkItemInSetRedis } from "../../redis/check-Item-In-set";

export const createAccessTokenFromRefreshToken = async (
  req: Request,
  res: Response
) => {
  try {
    const refreshToken = req.cookies.refreshtoken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is missing.",
      });
    }

    // check refresh token blacklisted or not
    const isBlacklisted = await checkItemInSetRedis(
      "blacklistedTokens",
      refreshToken
    );

    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is blacklisted.",
      });
    }

    const decodedData = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET!) as any;

    if (!decodedData) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid.",
      });
    }

    // create new access token
    const newAccessToken = createJwtToken(
      decodedData.userId,
      decodedData.username,
      decodedData.publicKey,
      "access"
    );

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: NODE_ENV === "development" ? false : true,
      expires: dayjs().add(1, "hours").toDate(),
    };

    res.cookie("accesstoken", newAccessToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "there is an error while refreshing tokens",
    });
  }
};

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createJwtToken } from "../../utils/createJwtToken";

export const createAccessTokenFromRefreshToken = async (
  req: Request,
  res: Response
) => {
  try {
    const refreshToken = req.headers.authorization?.split(" ")[1];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is missing.",
      });
    }

    const decodedData = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    ) as any;

    const newAccessToken = createJwtToken(
      decodedData.userId,
      decodedData.username,
      "access"
    );

    return res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully.",
      accesstoken: newAccessToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "there is an error while refreshing tokens",
    });
  }
};

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createJwtToken } from "../../utils/createJwtToken";
import { prisma } from "../../utils/prisma";

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

    const refreshTokenExists = await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
        userId: decodedData.userId,
      },
    });

    if (!refreshTokenExists) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid.",
      });
    }

    const [newAccessToken, newRefreshToken] = await Promise.all([
      createJwtToken(decodedData.userId, decodedData.username, "access"),
      createJwtToken(decodedData.userId, decodedData.username, "refresh"),
    ]);

    await prisma.refreshToken.update({
      where: {
        token: refreshToken,
        userId: decodedData.userId,
      },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully.",
      accesstoken: newAccessToken,
      refreshtoken: newRefreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "there is an error while refreshing tokens",
    });
  }
};

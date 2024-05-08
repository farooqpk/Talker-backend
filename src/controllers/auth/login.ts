import { CookieOptions, Request, Response } from "express";
import { createJwtToken } from "../../utils/createJwtToken";
import { prisma } from "../../utils/prisma";
import * as bcrypt from "bcrypt";

export const login = async (req: Request, res: Response) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    const isUserNameAlreadyExist = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!isUserNameAlreadyExist) {
      return res.status(404).json({
        success: false,
        message: "User doesnt exist",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      isUserNameAlreadyExist.password
    );

    if (!isPasswordCorrect) {
      return res.status(403).json({
        success: false,
        message: "User doesnt exist",
      });
    }

    const acessToken = createJwtToken(
      isUserNameAlreadyExist.userId,
      isUserNameAlreadyExist.username,
      "access"
    );
    const refreshToken = createJwtToken(
      isUserNameAlreadyExist.userId,
      isUserNameAlreadyExist.username,
      "refresh"
    );

    return res.status(200).send({
      success: true,
      message: "User logged in successfully",
      accesstoken: acessToken,
      refreshtoken: refreshToken,
      user: {
        userId: isUserNameAlreadyExist.userId,
        username: isUserNameAlreadyExist.username,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "An error occurred during login.",
    });
  }
};

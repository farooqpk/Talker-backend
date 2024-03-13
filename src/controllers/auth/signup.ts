import { CookieOptions, Request, Response } from "express";
import { createJwtToken } from "../../utils/createJwtToken";
import { prisma } from "../../utils/prisma";
import * as bcrypt from "bcrypt";

export const signup = async (req: Request, res: Response) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    const isUserNameAlreadyExist = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (isUserNameAlreadyExist) {
      return res.status(403).json({
        success: true,
        message: "Username Already Exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        createdAt: new Date(),
      },
      select: {
        userId: true,
        username: true,
      },
    });

    const [acessToken, refreshToken] = await Promise.all([
      createJwtToken(user.userId, user.username, "access"),
      createJwtToken(user.userId, user.username, "refresh"),
    ]);

    return res.status(201).send({
      success: true,
      message: "User created successfully",
      accesstoken: acessToken,
      refreshtoken: refreshToken,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "An error occurred during login.",
    });
  }
};

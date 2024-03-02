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
    });

    const token = createJwtToken(user.userId, user.username);

    // res.cookie("token", token, {
    //   // httpOnly: true,
    //   maxAge: 12 * 60 * 60 * 1000,
    // } as CookieOptions);

    return res.status(201).send({
      success: true,
      message: "User created successfully",
      token,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "An error occurred during login.",
    });
  }
};

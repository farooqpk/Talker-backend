import { CookieOptions, Request, Response } from "express";
import { createJwtToken } from "../../utils/createJwtToken";
import { prisma } from "../../utils/prisma";
import * as bcrypt from "bcrypt";
import { clearFromRedis } from "../../redis";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../../config";
import dayjs from "dayjs";

export const signup = async (req: Request, res: Response) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const publicKey = req.body.publicKey;

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
        publicKey,
        createdAt: new Date(),
      },
      select: {
        userId: true,
        username: true,
        publicKey: true,
      },
    });

    const accesstoken = createJwtToken(
      user.userId,
      user.username,
      user.publicKey,
      "access"
    );
    const refreshtoken = createJwtToken(
      user.userId,
      user.username,
      user.publicKey,
      "refresh"
    );

    await clearFromRedis({ pattern: `userid_not:*` });

    const cookieOptions: CookieOptions = {
      httpOnly: true,
    };

    res.cookie("accesstoken", accesstoken, {
      ...cookieOptions,
      expires: dayjs()
        .add(parseInt(ACCESS_TOKEN_EXPIRY || "2"), "hours")
        .toDate(),
    });
    res.cookie("refreshtoken", refreshtoken, {
      ...cookieOptions,
      expires: dayjs()
        .add(parseInt(REFRESH_TOKEN_EXPIRY || "30"), "days")
        .toDate(),
    });

    return res.status(201).send({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

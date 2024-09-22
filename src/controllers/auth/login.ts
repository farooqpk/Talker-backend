import { Request, Response } from "express";
import { prisma } from "../../utils/prisma";
import * as bcrypt from "bcrypt";
import { setDataInRedis } from "../../redis";

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

    // create random token for identifying user
    const loginToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // store that login token in redis for 5 minutes
    await setDataInRedis({
      key: `loginToken:${isUserNameAlreadyExist.userId}`,
      data: loginToken,
      expirationTimeInSeconds: 300,
      isString: true,
    });

    return res.status(200).send({
      success: true,
      loginToken,
      user: {
        userId: isUserNameAlreadyExist.userId,
        username: isUserNameAlreadyExist.username,
        publicKey: isUserNameAlreadyExist.publicKey,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "An error occurred during login.",
    });
  }
};

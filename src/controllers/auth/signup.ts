import { CookieOptions, Request, Response } from "express";
import { UserModel } from "../../models/user/User";
import { createJwtToken } from "../../helpers/createJwtToken";
import { getTempCachedUserData } from "../../redis/getTempCachedUserData";
import { AccesTokenData } from "../../types/UserData";

export const signup = async (req: Request, res: Response) => {
  try {
    const access_subId = req.headers.authorization?.split(" ")[1];

    const username = req.body.username;

    const tempCachedData: AccesTokenData = await getTempCachedUserData(
      access_subId as string
    );

    const user = await UserModel.create({
      sub: tempCachedData.sub,
      name: username,
      email: tempCachedData.email,
      picture: tempCachedData.picture,
    });

    const token = createJwtToken(user._id,user.name);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000, // Expiry time in milliseconds
    } as CookieOptions);

    return res.status(201).json(true);
  } catch (error: any) {
    if (error.message) {
      let errorMessage = error.message.toString();
      if (
        errorMessage.includes("duplicate key error collection") &&
        errorMessage.includes("email")
      ) {
        return res.status(403).json({
          success: false,
          message: "Please provide a unique email.",
        });
      } else if (
        errorMessage.includes("duplicate key error collection") &&
        errorMessage.includes("name")
      ) {
        return res.status(403).json({
          success: false,
          message: "Please provide a unique username.",
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        message: "An error occurred during login.",
      });
    }
  }
};

import { CookieOptions, Request, Response } from "express";
import { UserModel } from "../../models/user/User";
import { fetchFromAccessToken } from "../../helpers/fetchFromAccessToken";
import { cacheUserDataTemporary } from "../../redis/cacheUserDataTemporary";
import { createJwtToken } from "../../helpers/createJwtToken";

export const isUserAlreadyExistOrNot = async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization;

    if (!accessToken) {
      return res
        .status(403)
        .json({ success: false, message: "there is no access token" });
    }
    const accesedData = await fetchFromAccessToken(accessToken as string);
    const isUserExist = await UserModel.exists({ sub: accesedData.sub });

    if (isUserExist) {
      //create token
      const token = createJwtToken(isUserExist._id);

      res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 1 * 60 * 60 * 1000),
      } as CookieOptions);

      return res.status(200).json({ isExist: true });
    } else {
      await cacheUserDataTemporary(accesedData);
      return res.status(200).json({ isExist: false, subId: accesedData.sub });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "An error occurred while auth" });
  }
};

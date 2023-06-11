import { Request, Response } from "express";
import { fetchFromAccessToken } from "../../helper/fetchFromAccessToken";

export const login = async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization
    if (!accessToken) {
      res
        .status(401)
        .json({ success: false, message: "there is no access token" });
    }
    const userData = await fetchFromAccessToken(accessToken as string);
    console.log(userData);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "internal server error while login" });
  }
};

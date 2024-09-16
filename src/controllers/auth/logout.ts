import { Request, Response } from "express";
import { setDataAsSetInRedis } from "../../redis/set-data-as-set";

export const logout = async (req: Request, res: Response) => {
  try {
    const accesstoken = req.cookies.accesstoken;
    const refreshtoken = req.cookies.refreshtoken;
    if (!accesstoken || !refreshtoken) {
      return res
        .status(401)
        .json({ success: false, message: "token is missing" });
    }

    // blacklist the tokens
    await setDataAsSetInRedis({
      key: "blacklistedTokens",
      data: [accesstoken, refreshtoken],
      isString: true,
    });

    res.clearCookie("accesstoken");
    res.clearCookie("refreshtoken");

    res.status(200).json({ success: true, message: "logged out successfully" });
  } catch (error) {
    res.status(500).json(error);
  }
};

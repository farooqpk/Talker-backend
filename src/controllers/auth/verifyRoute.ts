import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DecodedPayload } from "../../types/DecodedPayload";

export const verifyRoute = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")?.[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "token is missing" });
  }

  try {
    const tokenDecoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as DecodedPayload;
    return res.status(200).json({
      success: true,
      message: "token is valid",
      payload: tokenDecoded,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(401)
      .json({ success: false, message: "token is invalid" });
  }
};

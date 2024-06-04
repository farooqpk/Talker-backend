import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DecodedPayload } from "../../types/DecodedPayload";
import { ACCESS_TOKEN_SECRET } from "../../config";

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
      ACCESS_TOKEN_SECRET!
    ) as DecodedPayload;
    return res.status(200).json({
      success: true,
      message: "token is valid",
      payload: {
        userId: tokenDecoded.userId,
        username: tokenDecoded.username,
        publicKey: tokenDecoded.publicKey,
      },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(401)
      .json({ success: false, message: "token is invalid" });
  }
};

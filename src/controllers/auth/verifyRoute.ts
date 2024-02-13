import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const verifyRoute = (req: Request, res: Response) => {
  if (req.headers.cookie) {
    const token = req.headers.cookie.split("=")[1];
    if (token) {
      jwt.verify(token, process.env.TOKEN_SECRET!, (err, tokenDecoded) => {
        if (err) {
          console.log(err);
          return res
            .status(401)
            .json({ success: false, message: "token is invalid" });
        } else {
          res.status(200).json({ success: true });
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: "there is an issue with your credentials!",
      });
    }
  } else {
    res.status(404).json({
      success: false,
      message: "there is no credentials in header!",
    });
  }
};

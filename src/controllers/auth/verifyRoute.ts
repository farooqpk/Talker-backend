import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { DecodedPayload } from "../../types/DecodedPayload";

export const verifyRoute = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "token is missing" });

  try {
    const tokenDecoded = jwt.verify(
      token,
      process.env.TOKEN_SECRET!
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

// export const verifyRoute = (req: Request, res: Response) => {
//   if (req.headers.cookie) {
//     const token = req.headers.cookie.split("=")[1];
//     if (token) {
//       jwt.verify(token, process.env.TOKEN_SECRET!, (err, tokenDecoded) => {
//         if (err) {
//           console.log(err);
//           return res
//             .status(401)
//             .json({ success: false, message: "token is invalid" });
//         } else {
//           res.status(200).json({ success: true });
//         }
//       });
//     } else {
//       res.status(404).json({
//         success: false,
//         message: "there is an issue with your credentials!",
//       });
//     }
//   } else {
//     res.status(404).json({
//       success: false,
//       message: "there is no credentials in header!",
//     });
//   }
// };

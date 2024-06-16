import { Request, Response } from "express";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { R2_BUCKET_NAME } from "../../config";
import { s3Client } from "../../utils/r2";
import { v4 as uuidv4 } from "uuid";

export const generateSignedUrl = async (req: Request, res: Response) => {
  try {
    const { filesize } = req.body;
    if (!filesize) {
      return res.status(400).json({
        success: false,
        message: "filesize is required",
      });
    }

    const uniqueKey = `messages/${uuidv4()}`;

    const url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME!,
        Key: uniqueKey,
        ContentType: "application/octet-stream",
        ContentLength: filesize,
      }),
      {
        expiresIn: 60, // 1 minutes
      }
    );

    return res.status(200).json({
      success: true,
      url,
      uniqueKey,
    });
  } catch (error) {
    return res.status(500).json(error);
  }
};

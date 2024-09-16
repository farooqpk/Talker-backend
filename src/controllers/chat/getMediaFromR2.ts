import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Request, Response } from "express";
import { R2_BUCKET_NAME } from "../../config";
import { s3Client } from "../../utils/r2";

export const getMediaFromR2 = async (req: Request, res: Response) => {
  try {
    const { mediapath } = req.params;

    if (!mediapath) {
      return res.status(400).json({
        success: false,
        message: "mediapath is required",
      });
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: mediapath,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return res.status(404).json({
        success: false,
        message: "media not found",
      });
    }

    res.setHeader("Content-Type", "application/octet-stream");

    const uint8Array = await response.Body.transformToByteArray();

    return res.status(200).send(Buffer.from(uint8Array));
  } catch (error) {
    console.error("Error fetching media from R2:", error);
    return res.status(500).json(error);
  }
};

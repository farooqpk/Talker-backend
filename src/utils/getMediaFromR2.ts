import { GetObjectCommand } from "@aws-sdk/client-s3";
import { R2_BUCKET_NAME } from "../config";
import { s3Client } from "./r2";

export const getMediaFromR2 = async (
  mediaPath: string
): Promise<Uint8Array | undefined> => {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME!,
    Key: mediaPath,
  });
  const response = await s3Client.send(command);
  const ui8Array = await response.Body?.transformToByteArray();
  return ui8Array;
};

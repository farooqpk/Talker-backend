import { redisClient } from ".././utils/redis";
import msgpack from "msgpack-lite";

export const setDataInRedis = async ({
  key,
  data,
  expirationTimeInSeconds,
  isString,
}: {
  key: string;
  data: any;
  expirationTimeInSeconds?: number;
  isString?: boolean;
}) => {
  try {
    if (expirationTimeInSeconds) {
      return await redisClient.setex(
        key,
        expirationTimeInSeconds,
        isString ? data : msgpack.encode(data)
      );
    } else {
      return await redisClient.set(key, isString ? data : msgpack.encode(data));
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

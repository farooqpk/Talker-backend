import { redisClient } from "../utils/redis";
import msgpack from "msgpack-lite";

export const setDataAsSetInRedis = async ({
  key,
  data,
  expirationTimeInSeconds,
  isString,
}: {
  key: string;
  data: Array<any>;
  expirationTimeInSeconds?: number;
  isString?: boolean;
}) => {
  try {
    const stringDataArray = data.map((d) => (isString ? d : msgpack.encode(d)));

    if (expirationTimeInSeconds) {
      return await redisClient
        .multi()
        .sadd(key, ...stringDataArray)
        .expire(key, expirationTimeInSeconds)
        .exec();
    } else {
      return await redisClient.sadd(key, ...stringDataArray);
    }
  } catch (error) {
    console.error("Error setting data as set in Redis:", error);
    throw error;
  }
};

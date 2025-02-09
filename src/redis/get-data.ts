import { redisClient } from ".././utils/redis";
import msgpack from "msgpack-lite";

export const getDataFromRedis = async (key: string, isString?: boolean) => {
  try {
    if (isString) {
      const data = await redisClient.get(key);
      return data;
    }

    const buffer = await redisClient.getBuffer(key);
    if (!buffer) {
      return null;
    }
    const data = msgpack.decode(buffer);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

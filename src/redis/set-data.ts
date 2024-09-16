import { redisClient } from ".././utils/redis";

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
        isString ? data : JSON.stringify(data)
      );
    } else {
      return await redisClient.set(key, isString ? data : JSON.stringify(data));
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

import { redisClient } from ".././utils/redis";

export const setDataInRedis = async (
  key: string,
  data: any,
  expirationTimeInSeconds: number,
  isString?: boolean
) => {
  try {
    return await redisClient.setex(
      key,
      expirationTimeInSeconds,
      isString ? data : JSON.stringify(data)
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};

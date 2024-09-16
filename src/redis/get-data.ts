import { redisClient } from ".././utils/redis";

export const getDataFromRedis = async (key: string, isString?: boolean) => {
  try {
    const data = await redisClient.get(key);
    if (data) return isString ? data : JSON.parse(data);
    return null;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

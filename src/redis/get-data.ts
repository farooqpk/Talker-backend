import { redisClient } from ".././utils/redis";

export const getDataFromRedis = async (key: string, isString?: boolean) => {
  try {
    const messages = await redisClient.get(key);
    if (messages) return isString ? messages : JSON.parse(messages);
    return null;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

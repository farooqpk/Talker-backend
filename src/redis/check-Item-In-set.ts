import { redisClient } from "../utils/redis";

export const checkItemInSetRedis = async (
  key: string,
  item: string
): Promise<boolean> => {
  try {
    const isMember = await redisClient.sismember(key, item);
    return isMember === 1;
  } catch (error) {
    console.error(`Error checking item in set ${key}:`, error);
    throw error;
  }
};

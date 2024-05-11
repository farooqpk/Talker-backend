import { redisClient } from ".././utils/redis";

export const clearCacheFromRedis = async ({
  key,
  pattern,
}: {
  key?: string | string[];
  pattern?: string;
}) => {
  try {
    if (pattern) {
      const keys = await redisClient.keys(pattern);
      return keys.length > 0 ? await redisClient.del(...keys) : 0;
    } else if (key) {
      if (Array.isArray(key)) {
        return key.length > 0 ? await redisClient.del(...key) : 0;
      } else {
        // Single key provided
        return await redisClient.del(key);
      }
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
    throw error;
  }
};

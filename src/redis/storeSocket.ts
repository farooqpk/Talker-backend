import { RedisClient } from "..";

export const storeSocketRedis = async (userId: string, socketId: string) => {
  await RedisClient.setEx(`ID:${userId}`,1800, socketId); // 1/2 hours
};

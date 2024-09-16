import Redis from "ioredis";
import { REDIS_URL } from "../config";

let redisClient: Redis;

const connectToRedis = async () => {
  try {
    redisClient = new Redis(REDIS_URL!);
    console.log("Redis connected");
    await Promise.all([clearSocketIdsOnStartup(), clearPeerIdsOnStartup()]);
  } catch (error) {
    console.error("Redis connection error:", error);
    throw error;
  }
};

const clearSocketIdsOnStartup = async () => {
  const socketIds = await redisClient.keys("socket:*");
  if (socketIds.length > 0) {
    await redisClient.del(...socketIds);
    console.log("Redis cleared socket ids on startup");
  } else {
    console.log("No socket ids to clear on startup");
  }
  return;
};

const clearPeerIdsOnStartup = async () => {
  const peerIds = await redisClient.keys("peer:*");
  if (peerIds.length > 0) {
    await redisClient.del(...peerIds);
    console.log("Redis cleared peer ids on startup");
  } else {
    console.log("No peer ids to clear on startup");
  }
  return;
};

export { redisClient, connectToRedis };

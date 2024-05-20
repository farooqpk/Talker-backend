import Redis from "ioredis";
import { REDIS_URL } from "../config";

let redisClient: Redis;

const connectToRedis = async () => {
  try {
    redisClient = new Redis(REDIS_URL!);
    console.log("Redis connected");
  } catch (error) {
    console.error("Redis connection error:", error);
    process.exit(1);
  }
};

export { redisClient, connectToRedis };

import Redis from "ioredis";

let redisClient: Redis;

const connectToRedis = async () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL!);
    console.log("Redis connected");
  } catch (error) {
    console.error("Redis connection error:", error);
    process.exit(1);
  }
};

export { redisClient, connectToRedis };

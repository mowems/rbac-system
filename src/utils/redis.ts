import Redis from 'ioredis';

// Configure Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1', // Update with AWS ElastiCache endpoint if deploying to AWS
  port: Number(process.env.REDIS_PORT) || 6379,
});

export const closeRedis = async () => {
  await redis.quit();
};

export default redis;

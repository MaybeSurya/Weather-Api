import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

/**
 * Returns a reusable singleton instance of Upstash Redis if configured.
 * Safely returns null if environment variables are not provided (e.g. during local tests).
 */
export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (!redisInstance) {
    redisInstance = new Redis({
      url,
      token,
    });
  }

  return redisInstance;
}

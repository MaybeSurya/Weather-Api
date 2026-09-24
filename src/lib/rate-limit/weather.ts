import { Ratelimit } from "@upstash/ratelimit";
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_SECONDS,
} from "../weather/constants";
import { RateLimitUnavailableError } from "../weather/errors";
import { getRedisClient } from "../redis/client";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  headers: Record<string, string>;
}

// In-memory sliding window store for local development/fallback
interface MemoryRecord {
  timestamps: number[];
}
const memoryStore = new Map<string, MemoryRecord>();

/**
 * Clean up aged entries in memory store periodically
 */
function cleanMemoryStore(now: number, windowMs: number) {
  if (memoryStore.size > 1000) {
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }
}

/**
 * In-memory sliding window rate limiter fallback for local development or when Redis is not configured.
 */
function checkMemoryRateLimit(
  identifier: string,
  limit: number = RATE_LIMIT_MAX_REQUESTS,
  windowSeconds: number = RATE_LIMIT_WINDOW_SECONDS
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  cleanMemoryStore(now, windowMs);

  let record = memoryStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(identifier, record);
  }

  // Filter timestamps within sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  const resetTimeSeconds = Math.ceil((now + windowMs) / 1000);

  if (record.timestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTimeSeconds,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": resetTimeSeconds.toString(),
      },
    };
  }

  record.timestamps.push(now);
  const remaining = limit - record.timestamps.length;

  return {
    success: true,
    limit,
    remaining,
    reset: resetTimeSeconds,
    headers: {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": resetTimeSeconds.toString(),
    },
  };
}

// Reusable Upstash rate limiter instance
let upstashRateLimiter: Ratelimit | null = null;

function getUpstashLimiter(): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  if (!upstashRateLimiter) {
    upstashRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_MAX_REQUESTS,
        `${RATE_LIMIT_WINDOW_SECONDS} s`
      ),
      prefix: "weather:ratelimit",
      analytics: false, // Keep cost minimal as required by Section 63
    });
  }

  return upstashRateLimiter;
}

/**
 * Checks rate limit for client IP.
 * Enforces 30 requests per minute with sliding window algorithm.
 * Handles fail-mode (closed vs open) if Redis experiences an outage.
 */
export async function checkRateLimit(clientIp: string): Promise<RateLimitResult> {
  const failMode = (process.env.RATE_LIMIT_FAIL_MODE || "closed").toLowerCase();
  const limiter = getUpstashLimiter();

  // If Upstash Redis credentials are not provided (e.g. local development), use in-memory sliding window
  if (!limiter) {
    return checkMemoryRateLimit(clientIp);
  }

  try {
    const result = await limiter.limit(clientIp);
    const resetSeconds = Math.ceil(result.reset / 1000);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: resetSeconds,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": resetSeconds.toString(),
      },
    };
  } catch (error: unknown) {
    console.error(
      JSON.stringify({
        event: "rate_limiter_failure",
        error: error instanceof Error ? error.message : String(error),
        clientIp,
        failMode,
        timestamp: new Date().toISOString(),
      })
    );

    // Fail-mode policy enforcement (Section 25)
    if (failMode === "open") {
      const nowSeconds = Math.ceil(Date.now() / 1000);
      return {
        success: true,
        limit: RATE_LIMIT_MAX_REQUESTS,
        remaining: RATE_LIMIT_MAX_REQUESTS,
        reset: nowSeconds + RATE_LIMIT_WINDOW_SECONDS,
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
          "X-RateLimit-Remaining": RATE_LIMIT_MAX_REQUESTS.toString(),
          "X-RateLimit-Reset": (nowSeconds + RATE_LIMIT_WINDOW_SECONDS).toString(),
        },
      };
    }

    throw new RateLimitUnavailableError(
      "Rate limiter service is temporarily unavailable."
    );
  }
}

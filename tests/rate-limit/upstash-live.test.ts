import { describe, expect, it } from "vitest";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

describe.runIf(hasUpstash)("Upstash Redis Live Distributed Rate Limiter", () => {
  const getLimiter = () => {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      prefix: "weather:ratelimit:vitest",
      analytics: false,
    });
    return { redis, ratelimit };
  };

  it("verifies live Upstash ping and connectivity", async () => {
    const { redis } = getLimiter();
    const pong = await redis.ping();
    expect(pong).toBe("PONG");
  });

  it("enforces 30 requests/minute and rejects 31st with live Redis persistence", async () => {
    const { redis, ratelimit } = getLimiter();
    const testIdentifier = `test-client-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Request 1: remaining 29
    const req1 = await ratelimit.limit(testIdentifier);
    expect(req1.success).toBe(true);
    expect(req1.limit).toBe(30);
    expect(req1.remaining).toBe(29);
    expect(req1.reset).toBeGreaterThan(Date.now());

    // Request 2: remaining 28
    const req2 = await ratelimit.limit(testIdentifier);
    expect(req2.success).toBe(true);
    expect(req2.remaining).toBe(28);

    // Requests 3 through 29
    for (let i = 3; i <= 29; i++) {
      const req = await ratelimit.limit(testIdentifier);
      expect(req.success).toBe(true);
      expect(req.remaining).toBe(30 - i);
    }

    // Request 30: success, remaining 0
    const req30 = await ratelimit.limit(testIdentifier);
    expect(req30.success).toBe(true);
    expect(req30.remaining).toBe(0);

    // Request 31: rejected with success: false (429 equivalent)
    const req31 = await ratelimit.limit(testIdentifier);
    expect(req31.success).toBe(false);
    expect(req31.remaining).toBe(0);

    // Verify key is backed by Redis
    const keys = await redis.keys(`weather:ratelimit:vitest:${testIdentifier}*`);
    expect(keys.length).toBeGreaterThan(0);

    // Cleanup test key
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });
});

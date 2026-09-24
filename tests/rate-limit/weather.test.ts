import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit/weather";

describe("Rate Limiting Service (Section 23, 24, 25, 126)", () => {
  it("allows up to 30 requests and rejects the 31st request with 429 semantics", async () => {
    const testIp = `test-ip-${Date.now()}`;

    // Execute requests 1 to 29
    for (let i = 1; i <= 29; i++) {
      const res = await checkRateLimit(testIp);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(30 - i);
      expect(res.headers["X-RateLimit-Limit"]).toBe("30");
      expect(res.headers["X-RateLimit-Remaining"]).toBe((30 - i).toString());
      expect(Number(res.headers["X-RateLimit-Reset"])).toBeGreaterThan(0);
    }

    // 30th request (last permitted)
    const thirtieth = await checkRateLimit(testIp);
    expect(thirtieth.success).toBe(true);
    expect(thirtieth.remaining).toBe(0);
    expect(thirtieth.headers["X-RateLimit-Remaining"]).toBe("0");

    // 31st request (must be rejected)
    const thirtyFirst = await checkRateLimit(testIp);
    expect(thirtyFirst.success).toBe(false);
    expect(thirtyFirst.remaining).toBe(0);
    expect(thirtyFirst.headers["X-RateLimit-Remaining"]).toBe("0");
    expect(Number(thirtyFirst.headers["X-RateLimit-Reset"])).toBeGreaterThan(0);
  });

  it("handles different client IPs independently", async () => {
    const ipA = `test-user-a-${Date.now()}`;
    const ipB = `test-user-b-${Date.now()}`;

    const resA = await checkRateLimit(ipA);
    const resB = await checkRateLimit(ipB);

    expect(resA.remaining).toBe(29);
    expect(resB.remaining).toBe(29);
  });

  it("fails closed in production if Redis is missing and failMode is closed", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalFailMode = process.env.RATE_LIMIT_FAIL_MODE;
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;

    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.RATE_LIMIT_FAIL_MODE = "closed";
      delete process.env.UPSTASH_REDIS_REST_URL;

      await expect(checkRateLimit("test-prod-ip")).rejects.toThrow(
        "Rate limiter service is temporarily unavailable."
      );
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      process.env.RATE_LIMIT_FAIL_MODE = originalFailMode;
      if (originalUrl) process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    }
  });

  it("fails open in production if Redis is missing and failMode is open", async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalFailMode = process.env.RATE_LIMIT_FAIL_MODE;
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;

    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.RATE_LIMIT_FAIL_MODE = "open";
      delete process.env.UPSTASH_REDIS_REST_URL;

      const res = await checkRateLimit("test-prod-ip-open");
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(30);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      process.env.RATE_LIMIT_FAIL_MODE = originalFailMode;
      if (originalUrl) process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    }
  });
});

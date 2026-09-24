/**
 * Integration unit tests for the /api/weather route handler.
 * Verifies HTTP status codes, headers, and error responses according to Section 12.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE, GET, OPTIONS, PATCH, POST, PUT } from "@/app/api/weather/route";
import * as rateLimiterModule from "@/lib/rate-limit/weather";
import { weatherService } from "@/lib/weather/service";
import {
  InvalidWeatherRequestError,
  LocationNotFoundError,
  ProviderUnavailableError,
} from "@/lib/weather/errors";
import type { WeatherResult } from "@/lib/weather/types";

describe("/api/weather Route Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("HTTP Method Enforcement (Section 12)", () => {
    it("returns HTTP 204 with CORS and Allow headers for OPTIONS preflight", async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      expect(res.headers.get("Allow")).toBe("GET, OPTIONS");
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, OPTIONS");
    });

    it("returns HTTP 405 Method Not Allowed for POST", async () => {
      const res = await POST();
      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data.status).toBe("error");
      expect(data.error.code).toBe("METHOD_NOT_ALLOWED");
      expect(res.headers.get("Allow")).toBe("GET, OPTIONS");
    });

    it("returns HTTP 405 Method Not Allowed for PUT", async () => {
      const res = await PUT();
      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data.status).toBe("error");
      expect(data.error.code).toBe("METHOD_NOT_ALLOWED");
    });

    it("returns HTTP 405 Method Not Allowed for PATCH", async () => {
      const res = await PATCH();
      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data.status).toBe("error");
      expect(data.error.code).toBe("METHOD_NOT_ALLOWED");
    });

    it("returns HTTP 405 Method Not Allowed for DELETE", async () => {
      const res = await DELETE();
      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data.status).toBe("error");
      expect(data.error.code).toBe("METHOD_NOT_ALLOWED");
    });
  });

  describe("Error Codes and Public JSON Envelopes (Section 12)", () => {
    it("returns HTTP 400 when query validation fails (INVALID_QUERY)", async () => {
      vi.spyOn(weatherService, "getWeather").mockRejectedValueOnce(
        new InvalidWeatherRequestError("City query exceeds maximum allowed length.")
      );

      const req = new NextRequest("http://localhost:3000/api/weather?city=toolong");
      const res = await GET(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.status).toBe("error");
      expect(data.error.code).toBe("INVALID_QUERY");
      expect(data.error.message).toContain("exceeds maximum allowed length");
      expect(data.error.stack).toBeUndefined(); // No stack trace leaked
    });

    it("returns HTTP 404 when city is not found (INVALID_CITY)", async () => {
      vi.spyOn(weatherService, "getWeather").mockRejectedValueOnce(
        new LocationNotFoundError("The requested city 'UnknownCity' could not be resolved.")
      );

      const req = new NextRequest("http://localhost:3000/api/weather?city=UnknownCity");
      const res = await GET(req);

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.status).toBe("error");
      expect(data.error.code).toBe("INVALID_CITY");
      expect(data.error.message).toContain("could not be resolved");
      expect(data.error.stack).toBeUndefined();
    });

    it("returns HTTP 429 when rate limit is exceeded (RATE_LIMIT_EXCEEDED)", async () => {
      vi.spyOn(rateLimiterModule, "checkRateLimit").mockResolvedValueOnce({
        success: false,
        limit: 30,
        remaining: 0,
        reset: 1700000000,
        headers: {
          "X-RateLimit-Limit": "30",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "1700000000",
        },
      });

      const req = new NextRequest("http://localhost:3000/api/weather?city=Delhi");
      const res = await GET(req);

      expect(res.status).toBe(429);
      expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
      const data = await res.json();
      expect(data.status).toBe("error");
      expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(data.error.stack).toBeUndefined();
    });

    it("returns HTTP 503 when all upstream providers fail (SERVICE_UNAVAILABLE)", async () => {
      vi.spyOn(weatherService, "getWeather").mockRejectedValueOnce(
        new ProviderUnavailableError("All weather providers are temporarily unavailable.")
      );

      const req = new NextRequest("http://localhost:3000/api/weather?city=Delhi");
      const res = await GET(req);

      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.status).toBe("error");
      expect(data.error.code).toBe("SERVICE_UNAVAILABLE");
      expect(data.error.stack).toBeUndefined();
    });

    it("returns HTTP 500 when an unexpected internal error occurs (INTERNAL_ERROR)", async () => {
      vi.spyOn(weatherService, "getWeather").mockRejectedValueOnce(
        new Error("Unexpected critical database fault")
      );

      const req = new NextRequest("http://localhost:3000/api/weather?city=Delhi");
      const res = await GET(req);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.status).toBe("error");
      expect(data.error.code).toBe("INTERNAL_ERROR");
      expect(data.error.message).toBe(
        "An unexpected server error occurred while retrieving weather data."
      );
      // Ensure raw error message or stack trace is not exposed
      expect(JSON.stringify(data)).not.toContain("Unexpected critical database fault");
      expect(data.error.stack).toBeUndefined();
    });
  });

  describe("Cache Policy Enforcement (Section 5)", () => {
    it("sets public CDN cache headers for explicit city queries", async () => {
      vi.spyOn(weatherService, "getWeather").mockResolvedValueOnce({
        response: {
          status: "success",
          provider: "open-meteo",
          location: { city: "Delhi", country: "India", timezone: "Asia/Kolkata" },
          coordinates: { latitude: 28.6139, longitude: 77.209 },
          weather: {
            temperature: "25°C",
            feels_like: "27°C",
            humidity: "80%",
            wind_speed: "8 km/h",
            condition_code: 0,
            description: "Clear Sky",
          },
          meta: { cached: false, timestamp: new Date().toISOString() },
        },
        rawResult: {} as unknown as WeatherResult,
        source: "geocoding",
        attempts: [],
      });

      const req = new NextRequest("http://localhost:3000/api/weather?city=Delhi");
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe(
        "public, s-maxage=600, stale-while-revalidate=300"
      );
      expect(res.headers.get("Vercel-CDN-Cache-Control")).toBe(
        "public, s-maxage=600, stale-while-revalidate=300"
      );
    });

    it("sets private no-store cache headers for implicit geolocation requests", async () => {
      vi.spyOn(weatherService, "getWeather").mockResolvedValueOnce({
        response: {
          status: "success",
          provider: "open-meteo",
          location: { city: "London", country: "GB", timezone: "Europe/London" },
          coordinates: { latitude: 51.5074, longitude: -0.1278 },
          weather: {
            temperature: "17°C",
            feels_like: "16°C",
            humidity: "72%",
            wind_speed: "7 km/h",
            condition_code: 0,
            description: "Clear Sky",
          },
          meta: { cached: false, timestamp: new Date().toISOString() },
        },
        rawResult: {} as unknown as WeatherResult,
        source: "cloudflare",
        attempts: [],
      });

      const req = new NextRequest("http://localhost:3000/api/weather");
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("Cache-Control")).toBe(
        "private, no-store, no-cache, must-revalidate"
      );
      expect(res.headers.get("Pragma")).toBe("no-cache");
    });
  });
});

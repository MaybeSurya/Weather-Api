import { describe, expect, it } from "vitest";
import {
  DEFAULT_FALLBACK_COORDINATES,
  DEFAULT_FALLBACK_LOCATION,
} from "@/lib/weather/constants";
import { InvalidWeatherRequestError } from "@/lib/weather/errors";
import {
  isValidCoordinate,
  resolveLocationFromHeaders,
  sanitizeCityInput,
} from "@/lib/weather/location";

describe("Location Input Sanitization", () => {
  it("returns null for empty or whitespace-only queries", () => {
    expect(sanitizeCityInput("")).toBeNull();
    expect(sanitizeCityInput("   ")).toBeNull();
    expect(sanitizeCityInput(null)).toBeNull();
    expect(sanitizeCityInput(undefined)).toBeNull();
  });

  it("trims and normalizes whitespace and unicode", () => {
    expect(sanitizeCityInput("  New   Delhi  ")).toBe("New Delhi");
    expect(sanitizeCityInput("São Paulo")).toBe("São Paulo");
  });

  it("rejects queries exceeding maximum allowed length", () => {
    const longString = "A".repeat(101);
    expect(() => sanitizeCityInput(longString)).toThrow(InvalidWeatherRequestError);
  });

  it("rejects queries containing control characters", () => {
    expect(() => sanitizeCityInput("Delhi\x00")).toThrow(InvalidWeatherRequestError);
    expect(() => sanitizeCityInput("London\x1F")).toThrow(InvalidWeatherRequestError);
  });
});

describe("Coordinate Validation", () => {
  it("validates latitude and longitude ranges properly", () => {
    expect(isValidCoordinate(28.6139, 77.209)).toBe(true);
    expect(isValidCoordinate(-90, 180)).toBe(true);
    expect(isValidCoordinate(90, -180)).toBe(true);
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(isValidCoordinate(0, 181)).toBe(false);
    expect(isValidCoordinate(NaN, 0)).toBe(false);
  });
});

describe("Cloudflare Header Geolocation Resolution", () => {
  it("extracts coordinates and city when Cloudflare headers are present and valid", () => {
    const headers = new Headers({
      "cf-iplatitude": "51.5074",
      "cf-iplongitude": "-0.1278",
      "cf-ipcity": "London",
      "cf-ipcountry": "GB",
      "cf-timezone": "Europe/London",
    });

    const result = resolveLocationFromHeaders(headers);
    expect(result.source).toBe("cloudflare");
    expect(result.coordinates.latitude).toBe(51.5074);
    expect(result.coordinates.longitude).toBe(-0.1278);
    expect(result.location.city).toBe("London");
    expect(result.location.country).toBe("GB");
    expect(result.location.timezone).toBe("Europe/London");
  });

  it("falls back to Aligarh, India when headers are missing or malformed", () => {
    const emptyHeaders = new Headers();
    const result1 = resolveLocationFromHeaders(emptyHeaders);
    expect(result1.source).toBe("fallback");
    expect(result1.location.city).toBe(DEFAULT_FALLBACK_LOCATION.city);
    expect(result1.coordinates).toEqual(DEFAULT_FALLBACK_COORDINATES);

    const malformedHeaders = new Headers({
      "cf-iplatitude": "999", // invalid latitude
      "cf-iplongitude": "0",
    });
    const result2 = resolveLocationFromHeaders(malformedHeaders);
    expect(result2.source).toBe("fallback");
    expect(result2.location.city).toBe(DEFAULT_FALLBACK_LOCATION.city);
  });
});

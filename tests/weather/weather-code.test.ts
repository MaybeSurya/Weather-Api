/**
 * Tests for the normalized condition taxonomy (condition.ts).
 * Replaces the old weather-code.ts tests now that condition handling
 * is unified across all providers.
 */

import { describe, expect, it } from "vitest";
import {
  getConditionCode,
  getConditionDescription,
  normalizeWmoCode,
} from "@/lib/weather/condition";

describe("Normalized Condition Taxonomy", () => {
  describe("normalizeWmoCode", () => {
    it("maps WMO clear sky codes correctly", () => {
      expect(normalizeWmoCode(0)).toBe("clear");
      expect(normalizeWmoCode(1)).toBe("mainly_clear");
      expect(normalizeWmoCode(2)).toBe("partly_cloudy");
      expect(normalizeWmoCode(3)).toBe("overcast");
    });

    it("maps WMO precipitation codes correctly", () => {
      expect(normalizeWmoCode(45)).toBe("fog");
      expect(normalizeWmoCode(51)).toBe("drizzle");
      expect(normalizeWmoCode(61)).toBe("rain");
      expect(normalizeWmoCode(65)).toBe("rain");
      expect(normalizeWmoCode(66)).toBe("freezing_rain");
      expect(normalizeWmoCode(71)).toBe("snow");
      expect(normalizeWmoCode(85)).toBe("snow_showers");
      expect(normalizeWmoCode(95)).toBe("thunderstorm");
    });

    it("returns 'unknown' for unrecognized WMO codes", () => {
      expect(normalizeWmoCode(999)).toBe("unknown");
      expect(normalizeWmoCode(-1)).toBe("unknown");
    });
  });

  describe("getConditionCode", () => {
    it("returns WMO-aligned codes for all core normalized conditions", () => {
      // 9 core conditions explicitly required by specification
      expect(getConditionCode("clear")).toBe(0);
      expect(getConditionCode("partly_cloudy")).toBe(2);
      expect(getConditionCode("cloudy")).toBe(3);
      expect(getConditionCode("overcast")).toBe(3);
      expect(getConditionCode("fog")).toBe(45);
      expect(getConditionCode("rain")).toBe(61);
      expect(getConditionCode("snow")).toBe(71);
      expect(getConditionCode("thunderstorm")).toBe(95);
      expect(getConditionCode("unknown")).toBe(0);

      // Additional supported normalized conditions
      expect(getConditionCode("mainly_clear")).toBe(1);
      expect(getConditionCode("drizzle")).toBe(51);
      expect(getConditionCode("freezing_rain")).toBe(66);
      expect(getConditionCode("snow_showers")).toBe(85);
    });

    it("returns 0 for unknown condition as safe fallback", () => {
      expect(getConditionCode("unknown")).toBe(0);
    });
  });

  describe("getConditionDescription", () => {
    it("returns human-readable descriptions for all core normalized conditions", () => {
      // 9 core conditions explicitly required by specification
      expect(getConditionDescription("clear")).toBe("Clear Sky");
      expect(getConditionDescription("partly_cloudy")).toBe("Partly Cloudy");
      expect(getConditionDescription("cloudy")).toBe("Cloudy");
      expect(getConditionDescription("overcast")).toBe("Overcast");
      expect(getConditionDescription("fog")).toBe("Foggy");
      expect(getConditionDescription("rain")).toBe("Rain");
      expect(getConditionDescription("snow")).toBe("Snow");
      expect(getConditionDescription("thunderstorm")).toBe("Thunderstorm");
      expect(getConditionDescription("unknown")).toBe("Unknown");

      // Additional supported normalized conditions
      expect(getConditionDescription("mainly_clear")).toBe("Mainly Clear");
      expect(getConditionDescription("drizzle")).toBe("Drizzle");
      expect(getConditionDescription("freezing_rain")).toBe("Freezing Rain");
      expect(getConditionDescription("snow_showers")).toBe("Snow Showers");
    });
  });

  describe("round-trip consistency", () => {
    it("normalizeWmoCode → getConditionCode returns a consistent code", () => {
      // WMO 2 → partly_cloudy → code 2
      const condition = normalizeWmoCode(2);
      expect(getConditionCode(condition)).toBe(2);

      // WMO 45 → fog → code 45
      const fogCondition = normalizeWmoCode(45);
      expect(getConditionCode(fogCondition)).toBe(45);
    });
  });
});

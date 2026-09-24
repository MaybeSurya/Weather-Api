/**
 * Normalized Weather Condition Taxonomy (Section 12)
 *
 * This module defines the canonical condition taxonomy used across all providers.
 * Every provider adapter maps its native condition representation into a
 * `NormalizedCondition` value. From that value, the serializer derives a
 * stable `conditionCode` (WMO-aligned where applicable) and a description.
 *
 * This ensures that clients receive semantically identical data regardless
 * of which upstream provider served the request.
 */

import type { NormalizedCondition } from "./types";

/**
 * Maps each NormalizedCondition to a synthetic WMO-aligned condition code.
 *
 * NOTE ON CODE UNIQUENESS (Section 4):
 * `condition_code` is aligned to WMO Code Table 4677 where equivalent codes exist.
 * Under the WMO standard, code 3 designates cloud coverage exceeding 7/8ths ("Overcast"),
 * and there is no distinct WMO code separating general "Cloudy" from "Overcast" at this level.
 * Therefore, both "cloudy" and "overcast" map to code 3, and "unknown" defaults to code 0.
 *
 * The public API contract DOES NOT guarantee that `condition_code` uniquely identifies
 * every semantic state. Integrators requiring unique semantic granularity must inspect the
 * `description` field ("Cloudy" vs "Overcast") or rely on internal normalized condition keys.
 * This ensures strict backward compatibility with existing clients without breaking schemas.
 */
export const NORMALIZED_CONDITION_CODES: Record<NormalizedCondition, number> = {
  clear: 0,
  mainly_clear: 1,
  partly_cloudy: 2,
  cloudy: 3,
  overcast: 3, // WMO standard assigns 3 to overcast; cloudy also maps to 3
  fog: 45,
  drizzle: 51,
  rain: 61,
  freezing_rain: 66,
  snow: 71,
  snow_showers: 85,
  thunderstorm: 95,
  unknown: 0,
};

/**
 * Human-readable description for each normalized condition.
 */
export const NORMALIZED_CONDITION_DESCRIPTIONS: Record<
  NormalizedCondition,
  string
> = {
  clear: "Clear Sky",
  mainly_clear: "Mainly Clear",
  partly_cloudy: "Partly Cloudy",
  cloudy: "Cloudy",
  overcast: "Overcast",
  fog: "Foggy",
  drizzle: "Drizzle",
  rain: "Rain",
  freezing_rain: "Freezing Rain",
  snow: "Snow",
  snow_showers: "Snow Showers",
  thunderstorm: "Thunderstorm",
  unknown: "Unknown",
};

/**
 * Returns the platform-normalized synthetic condition code for a given
 * normalized condition. Safe fallback to 0 for unknown conditions.
 */
export function getConditionCode(condition: NormalizedCondition): number {
  return NORMALIZED_CONDITION_CODES[condition] ?? 0;
}

/**
 * Returns the human-readable description for a given normalized condition.
 */
export function getConditionDescription(condition: NormalizedCondition): string {
  return NORMALIZED_CONDITION_DESCRIPTIONS[condition] ?? "Unknown";
}

// ---------------------------------------------------------------------------
// WMO code → NormalizedCondition mapping (used by Open-Meteo provider)
// Based on WMO Code Table 4677
// ---------------------------------------------------------------------------

export function normalizeWmoCode(code: number): NormalizedCondition {
  if (code === 0) return "clear";
  if (code === 1) return "mainly_clear";
  if (code === 2) return "partly_cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 65) return "rain";
  if (code === 66 || code === 67) return "freezing_rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain"; // rain showers → rain
  if (code === 85 || code === 86) return "snow_showers";
  if (code >= 95 && code <= 99) return "thunderstorm";
  return "unknown";
}

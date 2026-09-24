import type { Coordinates, Location } from "./types";

/**
 * System and Provider Constants
 */

// Fallback development location when Cloudflare visitor headers are unavailable (Section 19)
export const DEFAULT_FALLBACK_LOCATION: Location = {
  city: "Aligarh",
  country: "India",
  timezone: "Asia/Kolkata",
};

export const DEFAULT_FALLBACK_COORDINATES: Coordinates = {
  latitude: 27.8974,
  longitude: 78.088,
};

// Request Constraints
export const MAX_CITY_QUERY_LENGTH = 100;

// Timeout defaults (in milliseconds)
export const DEFAULT_GEOCODING_TIMEOUT_MS = 3000;
export const DEFAULT_WEATHERAPI_TIMEOUT_MS = 3000;
export const DEFAULT_METEOSOURCE_TIMEOUT_MS = 3500;
export const DEFAULT_OPEN_METEO_TIMEOUT_MS = 3000;
export const DEFAULT_MET_NO_TIMEOUT_MS = 3500;

// Upstream User-Agent identifier (required by MET Norway terms; good practice for all providers)
export const DEFAULT_PROVIDER_USER_AGENT =
  process.env.WEATHER_PROVIDER_USER_AGENT ||
  "maybesurya-weather-api/1.0 (+https://maybesurya.dev)";

// Rate limit configuration
export const RATE_LIMIT_MAX_REQUESTS = 30;
export const RATE_LIMIT_WINDOW_SECONDS = 60;

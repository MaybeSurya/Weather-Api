/**
 * Core Weather Domain and Public API Contract Types
 *
 * Strict typing adhering to the Production Refinement Prompt specifications.
 * Presentation strings are decoupled from domain models to support multi-unit serialization.
 * Internal numeric fields are preferred; formatting belongs in serialization/UI layers.
 */

// ---------------------------------------------------------------------------
// Provider taxonomy
// ---------------------------------------------------------------------------

export type WeatherProviderName =
  | "weatherapi"
  | "meteosource"
  | "open-meteo"
  | "met-no";

// ---------------------------------------------------------------------------
// Normalized condition taxonomy (Section 12)
// Maps every provider's native condition into a single stable semantic layer.
// ---------------------------------------------------------------------------

export type NormalizedCondition =
  | "clear"
  | "mainly_clear"
  | "partly_cloudy"
  | "cloudy"
  | "overcast"
  | "fog"
  | "drizzle"
  | "rain"
  | "freezing_rain"
  | "snow"
  | "snow_showers"
  | "thunderstorm"
  | "unknown";

// ---------------------------------------------------------------------------
// Core domain models — all numeric, no presentation strings
// ---------------------------------------------------------------------------

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  city: string;
  country: string;
  timezone: string;
}

export interface CurrentWeather {
  /** Temperature at 2 m above surface in degrees Celsius */
  temperatureCelsius: number;
  /** Apparent (feels-like) temperature in degrees Celsius */
  feelsLikeCelsius: number;
  /** Relative humidity as a percentage 0–100 */
  humidityPercent: number;
  /** Wind speed in km/h */
  windSpeedKmh: number;
  /**
   * Internal normalized condition — stable across all providers.
   * The public API exposes `condition_code` (a synthetic WMO-aligned integer)
   * derived from this value, so clients receive a consistent code regardless
   * of which provider supplied the data.
   */
  normalizedCondition: NormalizedCondition;
  /**
   * Synthetic condition code derived from the normalized condition.
   * Aligned to WMO codes where semantically equivalent; otherwise a
   * documented platform-internal code. NOT the raw provider code.
   */
  conditionCode: number;
  /** Human-readable condition description */
  description: string;
}

export interface WeatherResult {
  provider: WeatherProviderName;
  location: Location;
  coordinates: Coordinates;
  weather: CurrentWeather;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Public API Response Contract
// ---------------------------------------------------------------------------

export interface PublicWeatherAttributes {
  temperature: string; // e.g. "24°C"
  feels_like: string; // e.g. "26°C"
  humidity: string; // e.g. "65%"
  wind_speed: string; // e.g. "12 km/h"
  /**
   * Platform-normalized synthetic code (WMO Code Table 4677 aligned where applicable).
   * Note: This code is a meteorological indicator and does not guarantee 1:1 uniqueness
   * across all semantic conditions (e.g. WMO code 3 designates both cloudy and overcast).
   * Clients requiring distinct semantic granularity should inspect `description`.
   */
  condition_code: number;
  description: string; // e.g. "Partly Cloudy", "Cloudy", "Overcast"
}

export interface PublicWeatherMeta {
  cached: boolean;
  timestamp: string; // ISO 8601 UTC
}

export interface PublicWeatherSuccessResponse {
  status: "success";
  provider: WeatherProviderName;
  location: {
    city: string;
    country: string;
    timezone: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  weather: PublicWeatherAttributes;
  meta: PublicWeatherMeta;
}

export interface PublicWeatherErrorDetails {
  code: string;
  message: string;
}

export interface PublicWeatherErrorResponse {
  status: "error";
  error: PublicWeatherErrorDetails;
  meta: {
    timestamp: string;
  };
}

export type PublicWeatherResponse =
  | PublicWeatherSuccessResponse
  | PublicWeatherErrorResponse;

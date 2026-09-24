/**
 * Meteosource Provider Adapter
 *
 * API documentation: https://www.meteosource.com/documentation
 * Free tier: 400 calls/day.
 *
 * Meteosource uses "icon" string codes to represent weather conditions.
 * This adapter maps them to the platform's normalized condition taxonomy
 * to ensure cross-provider consistency.
 *
 * Required environment variable: METEOSOURCE_API_KEY
 * Never expose this key to the browser or client bundle.
 */

import { fetchWithTimeout } from "../../http/fetch";
import {
  DEFAULT_METEOSOURCE_TIMEOUT_MS,
  DEFAULT_PROVIDER_USER_AGENT,
} from "../constants";
import {
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
  WeatherError,
} from "../errors";
import type { Coordinates, NormalizedCondition } from "../types";
import {
  getConditionCode,
  getConditionDescription,
} from "../condition";
import type { IWeatherProvider, ProviderContext, ProviderWeatherResult } from "./types";

// ---------------------------------------------------------------------------
// Meteosource raw response shape (current weather fields we use)
// ---------------------------------------------------------------------------

interface MeteosourceCurrentWeather {
  temperature?: number;
  feels_like?: number;
  wind?: {
    speed?: number; // km/h
  };
  cloud_cover?: {
    total?: number; // percentage 0–100
  };
  precipitation?: {
    total?: number; // mm/h
  };
  humidity?: number; // percentage
  icon?: string;
}

interface MeteosourceApiResponse {
  lat?: string;
  lon?: string;
  timezone?: string;
  current?: MeteosourceCurrentWeather;
  elevation?: number;
}

// ---------------------------------------------------------------------------
// Meteosource icon → NormalizedCondition mapping (Section 12)
//
// Meteosource icon codes are string identifiers, not WMO codes.
// Source: https://www.meteosource.com/documentation#icons
// ---------------------------------------------------------------------------

const METEOSOURCE_ICON_MAP: Record<string, NormalizedCondition> = {
  "sunny": "clear",
  "clear-night": "clear",
  "mostly-sunny": "mainly_clear",
  "mostly-clear-night": "mainly_clear",
  "partly-sunny": "partly_cloudy",
  "partly-cloudy-night": "partly_cloudy",
  "cloudy": "cloudy",
  "overcast": "overcast",
  "fog": "fog",
  "light-fog": "fog",
  "drizzle": "drizzle",
  "rain": "rain",
  "possible-rain": "rain",
  "rain-snow": "freezing_rain",
  "possible-rain-snow": "freezing_rain",
  "freezing-rain": "freezing_rain",
  "possible-freezing-rain": "freezing_rain",
  "snow": "snow",
  "possible-snow": "snow",
  "flurries": "snow",
  "tstorm": "thunderstorm",
  "possible-tstorm": "thunderstorm",
  "thunderstorm": "thunderstorm",
  // night variants
  "mostly-cloudy-night": "cloudy",
  "partly-cloudy": "partly_cloudy",
  "mostly-cloudy": "cloudy",
  "light-wind": "clear",
  "wind": "clear",
  "strong-wind": "clear",
};

function normalizeMeteosourceIcon(icon: string | undefined): NormalizedCondition {
  if (!icon) return "unknown";
  const normalized = icon.toLowerCase().trim();
  return METEOSOURCE_ICON_MAP[normalized] ?? "unknown";
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export class MeteosourceProvider implements IWeatherProvider {
  public readonly name = "meteosource" as const;

  private getApiKey(): string {
    const key = process.env.METEOSOURCE_API_KEY;
    if (!key) {
      throw new WeatherError(
        "Meteosource API key is not configured. Set the METEOSOURCE_API_KEY environment variable.",
        503,
        "SERVICE_UNAVAILABLE"
      );
    }
    return key;
  }

  async getWeatherByCoordinates(
    coordinates: Coordinates,
    context?: ProviderContext
  ): Promise<ProviderWeatherResult> {
    const apiKey = this.getApiKey();
    const timeoutMs =
      Number(process.env.METEOSOURCE_TIMEOUT_MS) ||
      context?.timeoutMs ||
      DEFAULT_METEOSOURCE_TIMEOUT_MS;

    const url = new URL("https://www.meteosource.com/api/v1/free/point");
    url.searchParams.set("lat", coordinates.latitude.toFixed(4));
    url.searchParams.set("lon", coordinates.longitude.toFixed(4));
    url.searchParams.set("sections", "current");
    url.searchParams.set("timezone", "UTC");
    url.searchParams.set("language", "en");
    url.searchParams.set("units", "metric");
    url.searchParams.set("key", apiKey);

    const response = await fetchWithTimeout(url, {
      timeoutMs,
      providerName: this.name,
      headers: {
        "User-Agent": DEFAULT_PROVIDER_USER_AGENT,
        Accept: "application/json",
      },
    });

    if (response.status === 429) {
      throw new ProviderRateLimitError(this.name, "Meteosource upstream rate limit exceeded.");
    }

    if (response.status === 401 || response.status === 403) {
      throw new ProviderUnavailableError(
        "Meteosource authentication failed. Check METEOSOURCE_API_KEY."
      );
    }

    if (!response.ok) {
      if (response.status >= 500) {
        throw new ProviderUnavailableError(
          `Meteosource upstream service unavailable (HTTP ${response.status}).`
        );
      }
      throw new ProviderResponseError(
        this.name,
        `Meteosource request failed with HTTP ${response.status}.`
      );
    }

    let data: MeteosourceApiResponse;
    try {
      data = (await response.json()) as MeteosourceApiResponse;
    } catch {
      throw new ProviderResponseError(this.name, "Malformed JSON received from Meteosource.");
    }

    // Runtime response schema validation
    const current = data.current;

    if (
      !current ||
      typeof current.temperature !== "number" ||
      isNaN(current.temperature)
    ) {
      throw new ProviderResponseError(
        this.name,
        "Meteosource returned an incomplete or invalid weather payload."
      );
    }

    // Humidity may be absent on free tier for some regions — default to 0 with clear cast
    const humidityPercent =
      typeof current.humidity === "number" && !isNaN(current.humidity)
        ? current.humidity
        : 0;

    // Wind speed in km/h — default to 0 if absent
    const windSpeedKmh =
      typeof current.wind?.speed === "number" && !isNaN(current.wind.speed)
        ? current.wind.speed
        : 0;

    // Feels like — default to temperature if absent
    const feelsLikeCelsius =
      typeof current.feels_like === "number" && !isNaN(current.feels_like)
        ? current.feels_like
        : current.temperature;

    const resolvedLocation = context?.resolvedLocation ?? {
      city: "Detected Location",
      country: "",
      timezone: data.timezone || "UTC",
    };

    const normalizedCondition = normalizeMeteosourceIcon(current.icon);

    return {
      provider: this.name,
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
      location: resolvedLocation,
      weather: {
        temperatureCelsius: current.temperature,
        feelsLikeCelsius,
        humidityPercent,
        windSpeedKmh,
        normalizedCondition,
        conditionCode: getConditionCode(normalizedCondition),
        description: getConditionDescription(normalizedCondition),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

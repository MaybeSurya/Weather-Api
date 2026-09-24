/**
 * WeatherAPI.com Provider Adapter
 *
 * API documentation: https://www.weatherapi.com/docs/
 * Free tier: 1 million calls/month.
 *
 * LICENSING / REDISTRIBUTION NOTICE (Section 5):
 * WeatherAPI's free plan terms must be reviewed before use in a publicly
 * callable proxy endpoint. Attribution is typically required. Verify
 * current terms at https://www.weatherapi.com/terms.aspx before enabling
 * this adapter in a public production deployment.
 *
 * This adapter can be disabled via WEATHER_PROVIDER_PRIMARY / WEATHER_PROVIDER_FALLBACKS
 * environment variables if terms do not permit the intended use case.
 *
 * Required environment variable: WEATHER_API_KEY
 * Never expose this key to the browser or client bundle.
 */

import { fetchWithTimeout } from "../../http/fetch";
import {
  DEFAULT_WEATHERAPI_TIMEOUT_MS,
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
// WeatherAPI raw response shape (only fields we use)
// ---------------------------------------------------------------------------

interface WeatherApiCondition {
  code?: number;
  text?: string;
}

interface WeatherApiCurrent {
  temp_c?: number;
  feelslike_c?: number;
  humidity?: number;
  wind_kph?: number;
  condition?: WeatherApiCondition;
  last_updated?: string;
  last_updated_epoch?: number;
}

interface WeatherApiLocation {
  name?: string;
  country?: string;
  tz_id?: string;
  lat?: number;
  lon?: number;
}

interface WeatherApiResponse {
  location?: WeatherApiLocation;
  current?: WeatherApiCurrent;
  error?: { code?: number; message?: string };
}

// ---------------------------------------------------------------------------
// WeatherAPI condition code → NormalizedCondition mapping (Section 12)
//
// WeatherAPI uses its own proprietary condition codes, which differ from WMO codes.
// We must NOT treat them as WMO codes or mix them with Open-Meteo codes.
// Source: https://www.weatherapi.com/docs/conditions.json
// ---------------------------------------------------------------------------

const WEATHERAPI_CONDITION_MAP: Record<number, NormalizedCondition> = {
  1000: "clear",      // Sunny / Clear
  1003: "partly_cloudy", // Partly cloudy
  1006: "cloudy",     // Cloudy
  1009: "overcast",   // Overcast
  1030: "fog",        // Mist
  1063: "rain",       // Patchy rain possible
  1066: "snow",       // Patchy snow possible
  1069: "freezing_rain", // Patchy sleet possible
  1072: "drizzle",    // Patchy freezing drizzle possible
  1087: "thunderstorm", // Thundery outbreaks possible
  1114: "snow",       // Blowing snow
  1117: "snow",       // Blizzard
  1135: "fog",        // Fog
  1147: "fog",        // Freezing fog
  1150: "drizzle",    // Patchy light drizzle
  1153: "drizzle",    // Light drizzle
  1168: "freezing_rain", // Freezing drizzle
  1171: "freezing_rain", // Heavy freezing drizzle
  1180: "rain",       // Patchy light rain
  1183: "rain",       // Light rain
  1186: "rain",       // Moderate rain at times
  1189: "rain",       // Moderate rain
  1192: "rain",       // Heavy rain at times
  1195: "rain",       // Heavy rain
  1198: "freezing_rain", // Light freezing rain
  1201: "freezing_rain", // Moderate or heavy freezing rain
  1204: "freezing_rain", // Light sleet
  1207: "freezing_rain", // Moderate or heavy sleet
  1210: "snow",       // Patchy light snow
  1213: "snow",       // Light snow
  1216: "snow",       // Patchy moderate snow
  1219: "snow",       // Moderate snow
  1222: "snow",       // Patchy heavy snow
  1225: "snow",       // Heavy snow
  1237: "snow",       // Ice pellets
  1240: "rain",       // Light rain shower
  1243: "rain",       // Moderate or heavy rain shower
  1246: "rain",       // Torrential rain shower
  1249: "freezing_rain", // Light sleet showers
  1252: "freezing_rain", // Moderate or heavy sleet showers
  1255: "snow_showers", // Light snow showers
  1258: "snow_showers", // Moderate or heavy snow showers
  1261: "snow",       // Light showers of ice pellets
  1264: "snow",       // Moderate or heavy showers of ice pellets
  1273: "thunderstorm", // Patchy light rain with thunder
  1276: "thunderstorm", // Moderate or heavy rain with thunder
  1279: "thunderstorm", // Patchy light snow with thunder
  1282: "thunderstorm", // Moderate or heavy snow with thunder
};

/**
 * Maps a WeatherAPI proprietary condition code to the platform's normalized condition.
 */
function normalizeWeatherApiCode(code: number | undefined): NormalizedCondition {
  if (typeof code !== "number") return "unknown";
  return WEATHERAPI_CONDITION_MAP[code] ?? "unknown";
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export class WeatherApiProvider implements IWeatherProvider {
  public readonly name = "weatherapi" as const;

  private getApiKey(): string {
    const key = process.env.WEATHER_API_KEY;
    if (!key) {
      throw new WeatherError(
        "WeatherAPI key is not configured. Set the WEATHER_API_KEY environment variable.",
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
    const q = `${coordinates.latitude},${coordinates.longitude}`;
    return this._fetch(q, coordinates, context);
  }

  async getWeatherByCity(
    city: string,
    context?: ProviderContext
  ): Promise<ProviderWeatherResult> {
    return this._fetch(city, undefined, context);
  }

  private async _fetch(
    q: string,
    coordinates: Coordinates | undefined,
    context?: ProviderContext
  ): Promise<ProviderWeatherResult> {
    const apiKey = this.getApiKey();
    const timeoutMs =
      Number(process.env.WEATHERAPI_TIMEOUT_MS) ||
      context?.timeoutMs ||
      DEFAULT_WEATHERAPI_TIMEOUT_MS;

    const url = new URL("https://api.weatherapi.com/v1/current.json");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", q);
    url.searchParams.set("aqi", "no");

    const response = await fetchWithTimeout(url, {
      timeoutMs,
      providerName: this.name,
      headers: {
        "User-Agent": DEFAULT_PROVIDER_USER_AGENT,
        Accept: "application/json",
      },
    });

    if (response.status === 429) {
      throw new ProviderRateLimitError(this.name, "WeatherAPI upstream rate limit exceeded.");
    }

    if (response.status === 401 || response.status === 403) {
      // Key issue — treat as unavailable rather than leaking auth context
      throw new ProviderUnavailableError(
        "WeatherAPI authentication failed. Check WEATHER_API_KEY."
      );
    }

    if (!response.ok) {
      if (response.status >= 500) {
        throw new ProviderUnavailableError(
          `WeatherAPI upstream service unavailable (HTTP ${response.status}).`
        );
      }
      // 400-level errors may include a structured error body
      let errorBody: WeatherApiResponse | null = null;
      try {
        errorBody = (await response.json()) as WeatherApiResponse;
      } catch {
        // ignore parse failure
      }
      const errorMessage = errorBody?.error?.message ?? `WeatherAPI request failed with HTTP ${response.status}.`;
      throw new ProviderResponseError(this.name, errorMessage);
    }

    let data: WeatherApiResponse;
    try {
      data = (await response.json()) as WeatherApiResponse;
    } catch {
      throw new ProviderResponseError(this.name, "Malformed JSON received from WeatherAPI.");
    }

    // Runtime response schema validation
    const current = data.current;
    const loc = data.location;

    if (
      !current ||
      typeof current.temp_c !== "number" ||
      isNaN(current.temp_c) ||
      typeof current.feelslike_c !== "number" ||
      isNaN(current.feelslike_c) ||
      typeof current.humidity !== "number" ||
      isNaN(current.humidity) ||
      typeof current.wind_kph !== "number" ||
      isNaN(current.wind_kph)
    ) {
      throw new ProviderResponseError(
        this.name,
        "WeatherAPI returned an incomplete or invalid weather payload."
      );
    }

    // Use resolved location from service context if available (geocoding is already done upstream)
    // Fall back to WeatherAPI's location metadata
    const resolvedLocation = context?.resolvedLocation ?? {
      city: loc?.name || "Detected Location",
      country: loc?.country || "",
      timezone: loc?.tz_id || "UTC",
    };

    // Use coordinates from context or from WeatherAPI's location metadata
    const resolvedCoordinates: Coordinates = coordinates ?? {
      latitude: Number((loc?.lat ?? 0).toFixed(4)),
      longitude: Number((loc?.lon ?? 0).toFixed(4)),
    };

    // Map WeatherAPI's proprietary condition code to normalized taxonomy
    const normalizedCondition = normalizeWeatherApiCode(current.condition?.code);

    // Derive timestamp from WeatherAPI's last_updated field
    let timestamp = new Date().toISOString();
    if (current.last_updated) {
      const parsed = new Date(current.last_updated);
      if (!isNaN(parsed.getTime())) {
        timestamp = parsed.toISOString();
      }
    }

    return {
      provider: this.name,
      coordinates: resolvedCoordinates,
      location: resolvedLocation,
      weather: {
        temperatureCelsius: current.temp_c,
        feelsLikeCelsius: current.feelslike_c,
        humidityPercent: current.humidity,
        windSpeedKmh: current.wind_kph,
        normalizedCondition,
        conditionCode: getConditionCode(normalizedCondition),
        description: getConditionDescription(normalizedCondition),
      },
      timestamp,
    };
  }
}

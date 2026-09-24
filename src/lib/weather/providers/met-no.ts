/**
 * MET Norway Locationforecast 2.0 Provider Adapter
 *
 * Norwegian Meteorological Institute (https://api.met.no/).
 * Retained as an optional provider in the fallback chain.
 *
 * Terms: https://api.met.no/doc/TermsOfService
 * A valid User-Agent header identifying the application is REQUIRED by MET Norway.
 * This is enforced via DEFAULT_PROVIDER_USER_AGENT.
 *
 * This adapter maps MET Norway symbol codes into the platform's normalized
 * condition taxonomy to ensure cross-provider consistency.
 */

import { fetchWithTimeout } from "../../http/fetch";
import { DEFAULT_MET_NO_TIMEOUT_MS, DEFAULT_PROVIDER_USER_AGENT } from "../constants";
import {
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
} from "../errors";
import type { Coordinates, NormalizedCondition } from "../types";
import {
  getConditionCode,
  getConditionDescription,
} from "../condition";
import type { IWeatherProvider, ProviderContext, ProviderWeatherResult } from "./types";

interface MetNoInstantDetails {
  air_temperature?: number;
  relative_humidity?: number;
  wind_speed?: number; // meters per second
}

interface MetNoSummary {
  symbol_code?: string;
}

interface MetNoPeriodData {
  summary?: MetNoSummary;
}

interface MetNoTimeseriesItem {
  time?: string;
  data?: {
    instant?: {
      details?: MetNoInstantDetails;
    };
    next_1_hours?: MetNoPeriodData;
    next_6_hours?: MetNoPeriodData;
    next_12_hours?: MetNoPeriodData;
  };
}

interface MetNoApiResponse {
  properties?: {
    timeseries?: MetNoTimeseriesItem[];
  };
}

/**
 * Maps MET Norway symbol codes (after stripping day/night suffixes) to
 * the platform's normalized condition taxonomy.
 */
const MET_NO_SYMBOL_MAP: Record<string, NormalizedCondition> = {
  clearsky: "clear",
  fair: "mainly_clear",
  partlycloudy: "partly_cloudy",
  cloudy: "cloudy",
  fog: "fog",
  lightrainshowers: "rain",
  rainshowers: "rain",
  heavyrainshowers: "rain",
  lightrain: "rain",
  rain: "rain",
  heavyrain: "rain",
  sleet: "freezing_rain",
  lightsleet: "freezing_rain",
  heavysleet: "freezing_rain",
  lightsleetshowers: "freezing_rain",
  sleetshowers: "freezing_rain",
  heavysleetshowers: "freezing_rain",
  snow: "snow",
  lightsnow: "snow",
  heavysnow: "snow",
  lightsnowshowers: "snow_showers",
  snowshowers: "snow_showers",
  heavysnowshowers: "snow_showers",
  lightrainandthunder: "thunderstorm",
  rainandthunder: "thunderstorm",
  heavyrainandthunder: "thunderstorm",
  lightsleetandthunder: "thunderstorm",
  sleetandthunder: "thunderstorm",
  lightsnowandthunder: "thunderstorm",
  snowandthunder: "thunderstorm",
  lightrainshowersandthunder: "thunderstorm",
  rainshowersandthunder: "thunderstorm",
  lightsleetshowersandthunder: "thunderstorm",
  sleetshowersandthunder: "thunderstorm",
  lightsnowshowersandthunder: "thunderstorm",
  snowshowersandthunder: "thunderstorm",
};

/**
 * Strips day/night/polartwilight suffixes from MET Norway symbol codes
 * and maps to normalized condition.
 */
export function parseMetNoSymbol(rawSymbol: string | undefined): NormalizedCondition {
  if (!rawSymbol) return "unknown";
  const baseSymbol = rawSymbol.split("_")[0].toLowerCase();
  return MET_NO_SYMBOL_MAP[baseSymbol] ?? "unknown";
}

/**
 * Calculates Australian BOM / Steadman Apparent Temperature.
 * Formula: AT = Ta + 0.33 * e - 0.70 * ws - 4.00
 * where e = (rh / 100) * 6.105 * exp(17.27 * Ta / (237.7 + Ta))
 */
export function calculateApparentTemperature(
  tempC: number,
  humidityPercent: number,
  windSpeedMps: number
): number {
  const e = (humidityPercent / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  const apparent = tempC + 0.33 * e - 0.7 * windSpeedMps - 4.0;
  return Number(apparent.toFixed(1));
}

interface MetNoCacheEntry {
  result: ProviderWeatherResult;
  expiresAt: number;
  lastModified?: string;
}

const metNoCache = new Map<string, MetNoCacheEntry>();

/**
 * Resets the MET Norway in-memory freshness cache.
 * Exported for testing purposes.
 */
export function clearMetNoCache(): void {
  metNoCache.clear();
}

export class MetNoProvider implements IWeatherProvider {
  public readonly name = "met-no" as const;

  async getWeatherByCoordinates(
    coordinates: Coordinates,
    context?: ProviderContext
  ): Promise<ProviderWeatherResult> {
    const timeoutMs =
      Number(process.env.MET_NO_TIMEOUT_MS) ||
      context?.timeoutMs ||
      DEFAULT_MET_NO_TIMEOUT_MS;

    const cacheKey = `${coordinates.latitude.toFixed(4)},${coordinates.longitude.toFixed(4)}`;
    const now = Date.now();
    const cached = metNoCache.get(cacheKey);

    // Upstream Freshness: If MET Norway supplied an Expires header and it has not passed,
    // reuse the cached result without generating redundant upstream traffic.
    if (cached && cached.expiresAt > now) {
      if (context?.resolvedLocation) {
        return {
          ...cached.result,
          location: context.resolvedLocation,
        };
      }
      return cached.result;
    }

    const url = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
    url.searchParams.set("lat", coordinates.latitude.toFixed(4));
    url.searchParams.set("lon", coordinates.longitude.toFixed(4));

    const requestHeaders: Record<string, string> = {
      "User-Agent": DEFAULT_PROVIDER_USER_AGENT,
      Accept: "application/json",
    };

    // If we have an expired entry with Last-Modified, send conditional validation
    if (cached?.lastModified) {
      requestHeaders["If-Modified-Since"] = cached.lastModified;
    }

    const response = await fetchWithTimeout(url, {
      timeoutMs,
      providerName: this.name,
      headers: requestHeaders,
    });

    // Handle 304 Not Modified: Upstream data remains fresh
    if (response.status === 304 && cached) {
      const expiresHeader = response.headers.get("expires");
      if (expiresHeader) {
        const parsedExpires = new Date(expiresHeader).getTime();
        if (!isNaN(parsedExpires) && parsedExpires > now) {
          cached.expiresAt = parsedExpires;
        }
      }
      if (context?.resolvedLocation) {
        return {
          ...cached.result,
          location: context.resolvedLocation,
        };
      }
      return cached.result;
    }

    if (response.status === 403 || response.status === 429) {
      throw new ProviderRateLimitError(
        this.name,
        `MET Norway rejected request with status HTTP ${response.status}.`
      );
    }

    if (!response.ok) {
      if (response.status >= 500) {
        throw new ProviderUnavailableError(
          `MET Norway upstream service unavailable (HTTP ${response.status}).`
        );
      }
      throw new ProviderResponseError(
        this.name,
        `MET Norway request failed with HTTP ${response.status}.`
      );
    }

    let data: MetNoApiResponse;
    try {
      data = (await response.json()) as MetNoApiResponse;
    } catch {
      throw new ProviderResponseError(this.name, "Malformed JSON received from MET Norway.");
    }

    // Runtime response schema validation
    const timeseries = data.properties?.timeseries;
    if (!timeseries || !Array.isArray(timeseries) || timeseries.length === 0) {
      throw new ProviderResponseError(this.name, "MET Norway response missing timeseries data.");
    }

    const firstPoint = timeseries[0];
    const details = firstPoint.data?.instant?.details;

    if (
      !details ||
      typeof details.air_temperature !== "number" ||
      isNaN(details.air_temperature) ||
      typeof details.relative_humidity !== "number" ||
      isNaN(details.relative_humidity) ||
      typeof details.wind_speed !== "number" ||
      isNaN(details.wind_speed)
    ) {
      throw new ProviderResponseError(
        this.name,
        "MET Norway returned incomplete numeric weather measurements."
      );
    }

    // Convert wind speed from m/s to km/h
    const windSpeedMps = details.wind_speed;
    const windSpeedKmh = Number((windSpeedMps * 3.6).toFixed(1));

    // Calculate feels-like / apparent temperature
    const feelsLikeCelsius = calculateApparentTemperature(
      details.air_temperature,
      details.relative_humidity,
      windSpeedMps
    );

    // Map MET Norway symbol to normalized condition
    const symbolCode =
      firstPoint.data?.next_1_hours?.summary?.symbol_code ||
      firstPoint.data?.next_6_hours?.summary?.symbol_code ||
      firstPoint.data?.next_12_hours?.summary?.symbol_code;

    const normalizedCondition = parseMetNoSymbol(symbolCode);

    const resolvedLocation = context?.resolvedLocation ?? {
      city: "Detected Location",
      country: "",
      timezone: "UTC",
    };

    const result: ProviderWeatherResult = {
      provider: this.name,
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
      location: resolvedLocation,
      weather: {
        temperatureCelsius: details.air_temperature,
        feelsLikeCelsius,
        humidityPercent: details.relative_humidity,
        windSpeedKmh,
        normalizedCondition,
        conditionCode: getConditionCode(normalizedCondition),
        description: getConditionDescription(normalizedCondition),
      },
      timestamp: firstPoint.time
        ? new Date(firstPoint.time).toISOString()
        : new Date().toISOString(),
    };

    // Cache according to upstream Expires header to prevent unnecessary traffic
    const expiresHeader = response.headers.get("expires");
    const lastModifiedHeader = response.headers.get("last-modified");
    if (expiresHeader) {
      const parsedExpires = new Date(expiresHeader).getTime();
      if (!isNaN(parsedExpires) && parsedExpires > now) {
        metNoCache.set(cacheKey, {
          result,
          expiresAt: parsedExpires,
          lastModified: lastModifiedHeader ?? undefined,
        });

        // Prune aged entries if cache grows
        if (metNoCache.size > 200) {
          for (const [k, v] of metNoCache.entries()) {
            if (v.expiresAt <= now) {
              metNoCache.delete(k);
            }
          }
        }
      }
    }

    return result;
  }
}

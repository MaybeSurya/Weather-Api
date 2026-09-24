/**
 * Open-Meteo Weather Provider Adapter
 *
 * Free, open-source weather API (https://open-meteo.com/).
 * Licensed under CC BY 4.0.
 *
 * Open-Meteo's free endpoint is intended for non-commercial use.
 * Commercial usage requires a commercial plan.
 * Make production use configurable via WEATHER_ENABLE_OPEN_METEO_FALLBACK.
 *
 * This adapter uses WMO standard weather codes and maps them to the
 * platform's normalized condition taxonomy to ensure cross-provider consistency.
 */

import { fetchWithTimeout } from "../../http/fetch";
import { DEFAULT_OPEN_METEO_TIMEOUT_MS, DEFAULT_PROVIDER_USER_AGENT } from "../constants";
import {
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
} from "../errors";
import type { Coordinates } from "../types";
import {
  getConditionCode,
  getConditionDescription,
  normalizeWmoCode,
} from "../condition";
import type { IWeatherProvider, ProviderContext, ProviderWeatherResult } from "./types";

interface OpenMeteoCurrentWeather {
  time?: string;
  temperature_2m?: number;
  apparent_temperature?: number;
  relative_humidity_2m?: number;
  wind_speed_10m?: number;
  weather_code?: number;
}

interface OpenMeteoApiResponse {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  current?: OpenMeteoCurrentWeather;
}

export class OpenMeteoProvider implements IWeatherProvider {
  public readonly name = "open-meteo" as const;

  async getWeatherByCoordinates(
    coordinates: Coordinates,
    context?: ProviderContext
  ): Promise<ProviderWeatherResult> {
    const timeoutMs =
      Number(process.env.OPEN_METEO_TIMEOUT_MS) ||
      context?.timeoutMs ||
      DEFAULT_OPEN_METEO_TIMEOUT_MS;

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", coordinates.latitude.toString());
    url.searchParams.set("longitude", coordinates.longitude.toString());
    url.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code"
    );
    url.searchParams.set("timezone", "auto");

    const response = await fetchWithTimeout(url, {
      timeoutMs,
      providerName: this.name,
      headers: {
        "User-Agent": DEFAULT_PROVIDER_USER_AGENT,
        Accept: "application/json",
      },
    });

    if (response.status === 429) {
      throw new ProviderRateLimitError(this.name, "Open-Meteo upstream rate limit exceeded.");
    }

    if (!response.ok) {
      if (response.status >= 500) {
        throw new ProviderUnavailableError(
          `Open-Meteo upstream service unavailable (HTTP ${response.status}).`
        );
      }
      throw new ProviderResponseError(
        this.name,
        `Open-Meteo request failed with HTTP ${response.status}.`
      );
    }

    let data: OpenMeteoApiResponse;
    try {
      data = (await response.json()) as OpenMeteoApiResponse;
    } catch {
      throw new ProviderResponseError(this.name, "Malformed JSON received from Open-Meteo.");
    }

    // Runtime response schema validation
    const current = data.current;
    if (
      !current ||
      typeof current.temperature_2m !== "number" ||
      isNaN(current.temperature_2m) ||
      typeof current.apparent_temperature !== "number" ||
      isNaN(current.apparent_temperature) ||
      typeof current.relative_humidity_2m !== "number" ||
      isNaN(current.relative_humidity_2m) ||
      typeof current.wind_speed_10m !== "number" ||
      isNaN(current.wind_speed_10m) ||
      typeof current.weather_code !== "number" ||
      isNaN(current.weather_code)
    ) {
      throw new ProviderResponseError(
        this.name,
        "Open-Meteo returned an incomplete or invalid weather payload."
      );
    }

    const resolvedLocation = context?.resolvedLocation ?? {
      city: "Detected Location",
      country: "",
      timezone: data.timezone || "UTC",
    };

    // Normalize WMO code to platform taxonomy
    const normalizedCondition = normalizeWmoCode(current.weather_code);

    return {
      provider: this.name,
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
      location: resolvedLocation,
      weather: {
        temperatureCelsius: current.temperature_2m,
        feelsLikeCelsius: current.apparent_temperature,
        humidityPercent: current.relative_humidity_2m,
        windSpeedKmh: current.wind_speed_10m,
        normalizedCondition,
        conditionCode: getConditionCode(normalizedCondition),
        description: getConditionDescription(normalizedCondition),
      },
      timestamp: current.time ? new Date(current.time).toISOString() : new Date().toISOString(),
    };
  }
}

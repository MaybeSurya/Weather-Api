/**
 * Weather Service Orchestrator
 *
 * Resolves location → selects and executes the provider chain → serializes
 * the result into the stable public API response format.
 *
 * Provider selection is driven by environment variables:
 *   WEATHER_PROVIDER_PRIMARY   — name of the primary provider (default: "weatherapi")
 *   WEATHER_PROVIDER_FALLBACKS — comma-separated fallback chain (default: "meteosource,open-meteo")
 *   WEATHER_ENABLE_OPEN_METEO_FALLBACK — set to "false" to disable Open-Meteo in the chain
 *
 * This module must not contain any presentation logic; all formatting
 * (e.g. "23°C") belongs here as the boundary between domain and API contract.
 */

import {
  LocationNotFoundError,
  ProviderUnavailableError,
} from "./errors";
import {
  resolveCityByGeocoding,
  resolveLocationFromHeaders,
  sanitizeCityInput,
} from "./location";
import { MetNoProvider } from "./providers/met-no";
import { MeteosourceProvider } from "./providers/meteosource";
import { OpenMeteoProvider } from "./providers/open-meteo";
import { WeatherApiProvider } from "./providers/weatherapi";
import type { IWeatherProvider, ProviderWeatherResult } from "./providers/types";
import type {
  PublicWeatherSuccessResponse,
  WeatherResult,
} from "./types";

export interface GetWeatherOptions {
  city?: string | null;
  headers?: Headers;
  cached?: boolean;
}

export interface WeatherServiceExecutionResult {
  response: PublicWeatherSuccessResponse;
  rawResult: WeatherResult;
  source: "geocoding" | "cloudflare" | "fallback";
  attempts: Array<{
    provider: string;
    success: boolean;
    error?: string;
    durationMs: number;
  }>;
}

// ---------------------------------------------------------------------------
// Provider factory — maps string names to provider instances
// ---------------------------------------------------------------------------

const PROVIDER_REGISTRY: Record<string, () => IWeatherProvider> = {
  weatherapi: () => new WeatherApiProvider(),
  meteosource: () => new MeteosourceProvider(),
  "open-meteo": () => new OpenMeteoProvider(),
  "met-no": () => new MetNoProvider(),
};

/**
 * Builds the active provider chain from environment variables.
 *
 * Provider Selection Policy (Section 1 & 2):
 * - If WEATHER_PROVIDER_PRIMARY is explicitly configured, it is used.
 * - Otherwise:
 *   - If WEATHER_API_KEY is configured, defaults to "weatherapi".
 *   - Otherwise defaults to "open-meteo" (zero-key open access, CC BY 4.0).
 *
 * Fallback Policy:
 * - If WEATHER_PROVIDER_FALLBACKS is explicitly configured, it is used.
 * - Otherwise:
 *   - If primary is "weatherapi": defaults to "open-meteo,met-no".
 *   - If primary is "open-meteo": defaults to "met-no".
 * - Meteosource is supported via the provider registry but excluded from
 *   the default production chain because its free-tier terms restrict public proxying.
 * - WEATHER_ENABLE_OPEN_METEO_FALLBACK=false removes Open-Meteo from the chain.
 */
export function buildProviderChain(): IWeatherProvider[] {
  const hasWeatherApiKey = Boolean(process.env.WEATHER_API_KEY?.trim());
  const defaultPrimary = hasWeatherApiKey ? "weatherapi" : "open-meteo";

  const primary =
    process.env.WEATHER_PROVIDER_PRIMARY?.trim().toLowerCase() || defaultPrimary;

  const defaultFallbacks =
    primary === "weatherapi" ? "open-meteo,met-no" : "met-no";

  const fallbackString =
    process.env.WEATHER_PROVIDER_FALLBACKS?.trim().toLowerCase() ||
    defaultFallbacks;

  const fallbacks = fallbackString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const openMeteoEnabled =
    (process.env.WEATHER_ENABLE_OPEN_METEO_FALLBACK || "true").toLowerCase() !== "false";

  const chain: IWeatherProvider[] = [];

  const addProvider = (name: string) => {
    if (name === "open-meteo" && !openMeteoEnabled) return;
    const factory = PROVIDER_REGISTRY[name];
    if (factory) {
      chain.push(factory());
    } else {
      console.warn(
        JSON.stringify({
          event: "unknown_provider_name",
          name,
          timestamp: new Date().toISOString(),
        })
      );
    }
  };

  addProvider(primary);
  for (const name of fallbacks) {
    if (name !== primary) addProvider(name);
  }

  return chain;
}

// ---------------------------------------------------------------------------
// WeatherService
// ---------------------------------------------------------------------------

export class WeatherService {
  private providers: IWeatherProvider[];

  constructor(providers?: IWeatherProvider[]) {
    this.providers = providers ?? buildProviderChain();
  }

  /**
   * Replaces the active provider chain. Useful in tests.
   */
  public setProviders(providers: IWeatherProvider[]): void {
    this.providers = providers;
  }

  /**
   * Primary entry point for fetching weather by city or visitor headers.
   */
  public async getWeather(
    options: GetWeatherOptions = {}
  ): Promise<WeatherServiceExecutionResult> {
    const { city: rawCity, headers, cached = false } = options;

    const sanitizedCity = sanitizeCityInput(rawCity);
    let resolvedLocation: { city: string; country: string; timezone: string };
    let coordinates: { latitude: number; longitude: number };
    let source: "geocoding" | "cloudflare" | "fallback";

    if (sanitizedCity) {
      // User specified city → resolve coordinates via geocoding
      const geo = await resolveCityByGeocoding(sanitizedCity);
      resolvedLocation = geo.location;
      coordinates = geo.coordinates;
      source = "geocoding";
    } else {
      // Missing city → detect from Cloudflare headers or fall back to Aligarh
      const geo = resolveLocationFromHeaders(headers ?? new Headers());
      resolvedLocation = geo.location;
      coordinates = geo.coordinates;
      source = geo.source;
    }

    // Execute provider fallback chain
    const attempts: WeatherServiceExecutionResult["attempts"] = [];
    let providerResult: ProviderWeatherResult | null = null;

    for (const provider of this.providers) {
      const startTime = Date.now();
      try {
        providerResult = await provider.getWeatherByCoordinates(coordinates, {
          resolvedLocation,
        });

        attempts.push({
          provider: provider.name,
          success: true,
          durationMs: Date.now() - startTime,
        });
        break; // Successfully obtained weather
      } catch (err: unknown) {
        const durationMs = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : String(err);
        attempts.push({
          provider: provider.name,
          success: false,
          error: errorMessage,
          durationMs,
        });

        // LocationNotFoundError is non-recoverable — do not attempt fallback
        if (err instanceof LocationNotFoundError) {
          throw err;
        }

        // Continue to next fallback provider
      }
    }

    if (!providerResult) {
      throw new ProviderUnavailableError(
        "All weather providers are temporarily unavailable."
      );
    }

    const rawResult: WeatherResult = {
      provider: providerResult.provider,
      location: providerResult.location,
      coordinates: providerResult.coordinates,
      weather: providerResult.weather,
      timestamp: providerResult.timestamp,
    };

    // Serialize to public API format — this is the only place where numeric
    // internal values are converted to presentation strings
    const formattedResponse: PublicWeatherSuccessResponse = {
      status: "success",
      provider: rawResult.provider,
      location: {
        city: rawResult.location.city,
        country: rawResult.location.country,
        timezone: rawResult.location.timezone,
      },
      coordinates: {
        latitude: rawResult.coordinates.latitude,
        longitude: rawResult.coordinates.longitude,
      },
      weather: {
        temperature: `${Math.round(rawResult.weather.temperatureCelsius)}°C`,
        feels_like: `${Math.round(rawResult.weather.feelsLikeCelsius)}°C`,
        humidity: `${Math.round(rawResult.weather.humidityPercent)}%`,
        wind_speed: `${Math.round(rawResult.weather.windSpeedKmh)} km/h`,
        condition_code: rawResult.weather.conditionCode,
        description: rawResult.weather.description,
      },
      meta: {
        cached,
        timestamp: rawResult.timestamp,
      },
    };

    return {
      response: formattedResponse,
      rawResult,
      source,
      attempts,
    };
  }
}

// Global default service instance — lazily builds provider chain from env
export const weatherService = new WeatherService();

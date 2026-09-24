import { fetchWithTimeout } from "../http/fetch";
import {
  DEFAULT_FALLBACK_COORDINATES,
  DEFAULT_FALLBACK_LOCATION,
  DEFAULT_GEOCODING_TIMEOUT_MS,
  DEFAULT_PROVIDER_USER_AGENT,
  MAX_CITY_QUERY_LENGTH,
} from "./constants";
import { InvalidWeatherRequestError, LocationNotFoundError, ProviderResponseError } from "./errors";
import type { Coordinates, Location } from "./types";

export interface ResolvedLocationResult {
  location: Location;
  coordinates: Coordinates;
  source: "geocoding" | "cloudflare" | "fallback";
}

interface GeocodingResultItem {
  id?: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  country?: string;
  country_code?: string;
  population?: number;
  admin1?: string;
}

interface GeocodingApiResponse {
  results?: GeocodingResultItem[];
}

/**
 * Normalizes user-supplied city input.
 * Applies NFKC unicode normalization, trims whitespace, reduces consecutive spaces,
 * and validates bounds and control characters.
 */
export function sanitizeCityInput(rawCity: string | null | undefined): string | null {
  if (!rawCity) return null;

  // Trim and normalize unicode
  const normalized = rawCity.normalize("NFKC").trim().replace(/\s+/g, " ");

  if (normalized.length === 0) {
    return null;
  }

  // Reject oversized queries (Section 83)
  if (normalized.length > MAX_CITY_QUERY_LENGTH) {
    throw new InvalidWeatherRequestError(
      `City query exceeds maximum allowed length of ${MAX_CITY_QUERY_LENGTH} characters.`
    );
  }

  // Reject control characters (ASCII 0-31 and 127)
  if (/[\x00-\x1F\x7F]/.test(normalized)) {
    throw new InvalidWeatherRequestError("City query contains invalid control characters.");
  }

  return normalized;
}

/**
 * Resolves a city name using Open-Meteo Geocoding API with deterministic ambiguity resolution.
 */
export async function resolveCityByGeocoding(
  city: string,
  timeoutMs: number = DEFAULT_GEOCODING_TIMEOUT_MS
): Promise<{ location: Location; coordinates: Coordinates }> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetchWithTimeout(url, {
    timeoutMs,
    providerName: "open-meteo-geocoding",
    headers: {
      "User-Agent": DEFAULT_PROVIDER_USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new LocationNotFoundError(`The requested city '${city}' could not be resolved.`);
    }
    throw new ProviderResponseError(
      "open-meteo-geocoding",
      `Geocoding service returned HTTP status ${response.status}.`
    );
  }

  let data: GeocodingApiResponse;
  try {
    data = (await response.json()) as GeocodingApiResponse;
  } catch {
    throw new ProviderResponseError("open-meteo-geocoding", "Malformed JSON from geocoding service.");
  }

  if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
    throw new LocationNotFoundError(`The requested city '${city}' could not be resolved.`);
  }

  // Deterministic Ambiguity Resolution (Section 10)
  // 1. Exact match on normalized name
  // 2. Highest population
  // 3. Provider ranking (first item)
  const normalizedSearch = city.toLowerCase();
  const sorted = [...data.results].sort((a, b) => {
    const aExact = (a.name?.toLowerCase() === normalizedSearch) ? 1 : 0;
    const bExact = (b.name?.toLowerCase() === normalizedSearch) ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;

    const popA = typeof a.population === "number" ? a.population : 0;
    const popB = typeof b.population === "number" ? b.population : 0;
    return popB - popA;
  });

  const selected = sorted[0];

  if (
    typeof selected.latitude !== "number" ||
    typeof selected.longitude !== "number" ||
    isNaN(selected.latitude) ||
    isNaN(selected.longitude)
  ) {
    throw new ProviderResponseError("open-meteo-geocoding", "Geocoding returned invalid coordinate payload.");
  }

  return {
    location: {
      city: selected.name || city,
      country: selected.country || "",
      timezone: selected.timezone || "UTC",
    },
    coordinates: {
      latitude: Number(selected.latitude.toFixed(4)),
      longitude: Number(selected.longitude.toFixed(4)),
    },
  };
}

/**
 * Validates coordinate ranges (-90 to 90 for lat, -180 to 180 for lon).
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Extracts and validates visitor geolocation from Cloudflare Managed Transform headers.
 * Falls back to Aligarh, India if headers are missing or invalid (Section 11, 78).
 */
export function resolveLocationFromHeaders(headers: Headers): {
  location: Location;
  coordinates: Coordinates;
  source: "cloudflare" | "fallback";
} {
  const cfLatStr = headers.get("cf-iplatitude");
  const cfLonStr = headers.get("cf-iplongitude");
  const cfCity = headers.get("cf-ipcity");
  const cfCountry = headers.get("cf-ipcountry");
  const cfTimezone = headers.get("cf-timezone");

  if (cfLatStr && cfLonStr) {
    const lat = parseFloat(cfLatStr);
    const lon = parseFloat(cfLonStr);

    if (isValidCoordinate(lat, lon)) {
      return {
        location: {
          city: cfCity ? decodeURIComponent(cfCity) : "Detected Location",
          country: cfCountry || "Global",
          timezone: cfTimezone || "UTC",
        },
        coordinates: {
          latitude: Number(lat.toFixed(4)),
          longitude: Number(lon.toFixed(4)),
        },
        source: "cloudflare",
      };
    }
  }

  // Local development / non-Cloudflare fallback: Aligarh, India (Section 11)
  return {
    location: { ...DEFAULT_FALLBACK_LOCATION },
    coordinates: { ...DEFAULT_FALLBACK_COORDINATES },
    source: "fallback",
  };
}

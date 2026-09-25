import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, SECURITY_HEADERS } from "@/lib/http/headers";
import { jsonResponse } from "@/lib/http/response";

export interface SearchSuggestion {
  id: string;
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
  distanceKm?: number;
  isNearby?: boolean;
}

interface OpenMeteoGeocodingItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
}

interface WeatherApiSearchItem {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

/**
 * Calculates great-circle distance (Haversine formula) in kilometers
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes intelligent search relevance score prioritizing user's approximate location
 */
function getRelevanceScore(
  item: { name: string; region: string; country: string; latitude: number; longitude: number },
  query: string,
  userLat?: number,
  userLon?: number,
  userCountry?: string
): number {
  let score = 0;
  const lowerName = item.name.toLowerCase().trim();
  const lowerQ = query.toLowerCase().trim();
  const lowerCountry = item.country.toLowerCase().trim();
  const lowerRegion = item.region.toLowerCase().trim();

  // 1. Textual Match Scoring
  if (lowerName === lowerQ) {
    score += 25000;
  } else if (lowerName.startsWith(lowerQ)) {
    score += 12000;
  } else {
    const words = lowerName.split(/[\s,-]+/);
    if (words.some((w) => w.startsWith(lowerQ))) {
      score += 7000;
    } else if (lowerName.includes(lowerQ)) {
      score += 3500;
    } else if (lowerRegion.startsWith(lowerQ) || lowerCountry.startsWith(lowerQ)) {
      score += 2000;
    }
  }

  // 2. Proximity & Geographic Distance Boost (Closest to user ranks highest)
  if (
    userLat !== undefined &&
    userLon !== undefined &&
    !isNaN(userLat) &&
    !isNaN(userLon) &&
    item.latitude &&
    item.longitude
  ) {
    const distKm = calculateDistanceKm(userLat, userLon, item.latitude, item.longitude);
    if (distKm < 50) {
      score += 15000; // Immediate town/district
    } else if (distKm < 150) {
      score += 10000; // Neighboring city
    } else if (distKm < 500) {
      score += 6500; // Same state/province
    } else if (distKm < 1200) {
      score += 4000; // Same country/subcontinent
    } else if (distKm < 2500) {
      score += 1500;
    }
    // Gradual decay bonus
    score += Math.max(0, 3000 - distKm * 1.2);
  }

  // 3. Country Matching Boost
  if (userCountry) {
    const uCountry = userCountry.toLowerCase();
    if (
      lowerCountry.includes(uCountry) ||
      (uCountry === "in" && (lowerCountry.includes("india") || lowerCountry === "in")) ||
      (uCountry === "us" && (lowerCountry.includes("united states") || lowerCountry === "usa" || lowerCountry === "us")) ||
      (uCountry === "gb" && (lowerCountry.includes("united kingdom") || lowerCountry === "uk" || lowerCountry === "gb"))
    ) {
      score += 6000;
    }
  }

  // 4. Region presence bonus
  if (item.region) {
    score += 400;
  }

  // 5. Length tie-breaker (prefer concise names closer to query length)
  score += Math.max(0, 50 - Math.abs(item.name.length - query.length));

  return score;
}

/**
 * OPTIONS /api/weather/search
 */
export async function OPTIONS(): Promise<NextResponse> {
  const headers = new Headers();
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }
  headers.set("Allow", "GET, OPTIONS");

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * GET /api/weather/search?q=rudr&lat=28.98&lon=79.40&country=IN
 * Live location search / autocomplete index with location-aware smart relevance.
 * Prioritizes locations near the user's approximate coordinates and country.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";

  if (!query || query.length < 2) {
    return jsonResponse(
      {
        status: "success",
        suggestions: [],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  }

  // Determine user's approximate location from query params or headers
  const paramLat = searchParams.get("lat");
  const paramLon = searchParams.get("lon");
  const paramCountry = searchParams.get("country");

  const headerLat = request.headers.get("x-vercel-ip-latitude");
  const headerLon = request.headers.get("x-vercel-ip-longitude");
  const headerCountry = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry");

  const userLat = paramLat ? parseFloat(paramLat) : headerLat ? parseFloat(headerLat) : undefined;
  const userLon = paramLon ? parseFloat(paramLon) : headerLon ? parseFloat(headerLon) : undefined;
  const userCountry = paramCountry || headerCountry || undefined;

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  const addSuggestion = (item: SearchSuggestion) => {
    // Unique deduplication key: lowercase name + lowercase region
    const key = `${item.name.toLowerCase()}::${item.region.toLowerCase()}::${item.country.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);

      // Compute distance if user coordinates are known
      if (
        userLat !== undefined &&
        userLon !== undefined &&
        !isNaN(userLat) &&
        !isNaN(userLon) &&
        item.latitude &&
        item.longitude
      ) {
        const dist = calculateDistanceKm(userLat, userLon, item.latitude, item.longitude);
        item.distanceKm = Math.round(dist);
        item.isNearby = dist < 200;
      }

      suggestions.push(item);
    }
  };

  const tasks: Promise<void>[] = [];

  // 1. Query Open-Meteo Geocoding with higher limit for rich candidate pool
  tasks.push(
    (async () => {
      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", query);
        url.searchParams.set("count", "25");
        url.searchParams.set("language", "en");
        url.searchParams.set("format", "json");

        const res = await fetch(url.toString(), {
          headers: {
            "User-Agent": process.env.WEATHER_PROVIDER_USER_AGENT || "maybesurya-weather-api/1.0",
          },
          signal: AbortSignal.timeout(3000),
        });

        if (res.ok) {
          const data = (await res.json()) as { results?: OpenMeteoGeocodingItem[] };
          if (Array.isArray(data.results)) {
            for (const item of data.results) {
              const region = item.admin1 || "";
              const country = item.country || "";
              const parts = [item.name, region, country].filter(Boolean);
              addSuggestion({
                id: `om-${item.id}`,
                name: item.name,
                region,
                country,
                latitude: item.latitude,
                longitude: item.longitude,
                displayName: parts.join(", "),
              });
            }
          }
        }
      } catch {
        // Silently swallow search provider timeouts
      }
    })()
  );

  // 2. Query WeatherAPI Search if API key is configured
  const weatherApiKey = process.env.WEATHER_API_KEY?.trim();
  if (weatherApiKey) {
    tasks.push(
      (async () => {
        try {
          const url = new URL("https://api.weatherapi.com/v1/search.json");
          url.searchParams.set("key", weatherApiKey);
          url.searchParams.set("q", query);

          const res = await fetch(url.toString(), {
            signal: AbortSignal.timeout(3000),
          });

          if (res.ok) {
            const data = (await res.json()) as WeatherApiSearchItem[];
            if (Array.isArray(data)) {
              for (const item of data) {
                const region = item.region || "";
                const country = item.country || "";
                const parts = [item.name, region, country].filter(Boolean);
                addSuggestion({
                  id: `wapi-${item.id}`,
                  name: item.name,
                  region,
                  country,
                  latitude: item.lat,
                  longitude: item.lon,
                  displayName: parts.join(", "),
                });
              }
            }
          }
        } catch {
          // Silently swallow search provider timeouts
        }
      })()
    );
  }

  await Promise.allSettled(tasks);

  // Smart relevance sorting: proximity to user + text prefix + country match
  suggestions.sort((a, b) => {
    const scoreA = getRelevanceScore(a, query, userLat, userLon, userCountry);
    const scoreB = getRelevanceScore(b, query, userLat, userLon, userCountry);
    return scoreB - scoreA;
  });

  return jsonResponse(
    {
      status: "success",
      query,
      userLocationApplied: Boolean(userLat && userLon),
      suggestions: suggestions.slice(0, 8),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}

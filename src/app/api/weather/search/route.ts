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
}

interface OpenMeteoGeocodingItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
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
 * GET /api/weather/search?q=rudr
 * Live location search / autocomplete index.
 * Combines Open-Meteo Geocoding and WeatherAPI Search (when key is available)
 * to provide instantaneous search suggestions (e.g. "Rudrapur, Uttarakhand", "Rudraprayag, Uttarakhand").
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

  const suggestions: SearchSuggestion[] = [];
  const seen = new Set<string>();

  const addSuggestion = (item: SearchSuggestion) => {
    // Unique deduplication key: lowercase name + lowercase region
    const key = `${item.name.toLowerCase()}::${item.region.toLowerCase()}::${item.country.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      suggestions.push(item);
    }
  };

  const tasks: Promise<void>[] = [];

  // 1. Query Open-Meteo Geocoding
  tasks.push(
    (async () => {
      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", query);
        url.searchParams.set("count", "8");
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

  // Sort: prioritize items that start with the query, then by shortest name
  const lowerQ = query.toLowerCase();
  suggestions.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(lowerQ);
    const bStarts = b.name.toLowerCase().startsWith(lowerQ);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.length - b.name.length;
  });

  return jsonResponse(
    {
      status: "success",
      query,
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

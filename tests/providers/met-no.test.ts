import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ProviderRateLimitError,
  ProviderResponseError,
} from "@/lib/weather/errors";
import {
  calculateApparentTemperature,
  clearMetNoCache,
  MetNoProvider,
  parseMetNoSymbol,
} from "@/lib/weather/providers/met-no";

describe("MetNoProvider", () => {
  const provider = new MetNoProvider();

  beforeEach(() => {
    clearMetNoCache();
    vi.restoreAllMocks();
  });

  const mockValidResponse = {
    properties: {
      timeseries: [
        {
          time: "2026-09-25T03:00:00Z",
          data: {
            instant: {
              details: {
                air_temperature: 20.5,
                relative_humidity: 72,
                wind_speed: 3.2, // m/s
              },
            },
            next_1_hours: {
              summary: { symbol_code: "partlycloudy_day" },
            },
          },
        },
      ],
    },
  };

  it("normalizes a valid MET Norway response into platform taxonomy", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockValidResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await provider.getWeatherByCoordinates(
      { latitude: 59.9139, longitude: 10.7522 },
      {
        resolvedLocation: {
          city: "Oslo",
          country: "Norway",
          timezone: "Europe/Oslo",
        },
      }
    );

    expect(result.provider).toBe("met-no");
    expect(result.weather.temperatureCelsius).toBe(20.5);
    expect(result.weather.humidityPercent).toBe(72);
    expect(result.weather.windSpeedKmh).toBeCloseTo(3.2 * 3.6, 1);
    // partlycloudy_day → partly_cloudy
    expect(result.weather.normalizedCondition).toBe("partly_cloudy");
    expect(result.weather.conditionCode).toBe(2);
    expect(result.weather.description).toBe("Partly Cloudy");
    expect(result.location.city).toBe("Oslo");
  });

  it("throws ProviderRateLimitError on HTTP 429", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Too Many Requests", { status: 429 })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderRateLimitError);
  });

  it("throws ProviderRateLimitError on HTTP 403", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Forbidden", { status: 403 })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderRateLimitError);
  });

  it("throws ProviderResponseError on malformed JSON", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("not json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderResponseError);
  });

  it("throws ProviderResponseError when required numeric fields are missing", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          properties: {
            timeseries: [
              {
                data: {
                  instant: {
                    details: { air_temperature: "not-a-number" },
                  },
                },
              },
            ],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderResponseError);
  });

  it("respects upstream Expires header to prevent unnecessary traffic", async () => {
    const futureExpires = new Date(Date.now() + 600000).toUTCString();
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockValidResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          Expires: futureExpires,
          "Last-Modified": "Thu, 24 Sep 2026 23:00:00 GMT",
        },
      })
    );

    const coords = { latitude: 59.9139, longitude: 10.7522 };

    // Initial request: fetches upstream
    const res1 = await provider.getWeatherByCoordinates(coords);
    expect(res1.weather.temperatureCelsius).toBe(20.5);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second request within Expires window: served from cache, zero upstream traffic
    const res2 = await provider.getWeatherByCoordinates(coords);
    expect(res2.weather.temperatureCelsius).toBe(20.5);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // Still 1!
  });
});

describe("parseMetNoSymbol", () => {
  it("strips day/night suffix and maps to normalized condition", () => {
    expect(parseMetNoSymbol("clearsky_day")).toBe("clear");
    expect(parseMetNoSymbol("partlycloudy_night")).toBe("partly_cloudy");
    expect(parseMetNoSymbol("rain")).toBe("rain");
    expect(parseMetNoSymbol("snow")).toBe("snow");
    expect(parseMetNoSymbol("rainandthunder")).toBe("thunderstorm");
    expect(parseMetNoSymbol("fog")).toBe("fog");
  });

  it("returns 'unknown' for unrecognized symbols", () => {
    expect(parseMetNoSymbol("unrecognized_symbol")).toBe("unknown");
    expect(parseMetNoSymbol(undefined)).toBe("unknown");
  });
});

describe("calculateApparentTemperature", () => {
  it("calculates apparent temperature using Steadman formula", () => {
    const at = calculateApparentTemperature(20.5, 72, 3.2);
    expect(at).toBeTypeOf("number");
    expect(at).not.toBeNaN();
  });
});

/**
 * Provider orchestration tests.
 * Tests the WeatherAPI → Meteosource → Open-Meteo fallback chain.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ProviderResponseError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from "@/lib/weather/errors";
import { MeteosourceProvider } from "@/lib/weather/providers/meteosource";
import { OpenMeteoProvider } from "@/lib/weather/providers/open-meteo";
import { WeatherApiProvider } from "@/lib/weather/providers/weatherapi";
import { WeatherService } from "@/lib/weather/service";
import type { ProviderWeatherResult } from "@/lib/weather/providers/types";

/** Creates a minimal valid ProviderWeatherResult for a given provider name */
function makeResult(provider: "weatherapi" | "meteosource" | "open-meteo"): ProviderWeatherResult {
  return {
    provider,
    coordinates: { latitude: 28.6139, longitude: 77.209 },
    location: { city: "Delhi", country: "India", timezone: "Asia/Kolkata" },
    weather: {
      temperatureCelsius: 25.0,
      feelsLikeCelsius: 26.5,
      humidityPercent: 55,
      windSpeedKmh: 8.0,
      normalizedCondition: "clear",
      conditionCode: 0,
      description: "Clear Sky",
    },
    timestamp: "2026-09-25T12:00:00.000Z",
  };
}

/** Mock geocoding to return Delhi coordinates */
function mockGeocoding() {
  vi.spyOn(global, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        results: [
          {
            name: "Delhi",
            country: "India",
            latitude: 28.6139,
            longitude: 77.209,
            timezone: "Asia/Kolkata",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  );
}

describe("Provider Orchestration — WeatherAPI → Meteosource → Open-Meteo", () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = "test-weatherapi-key";
    process.env.METEOSOURCE_API_KEY = "test-meteosource-key";
  });

  it("succeeds when WeatherAPI is primary and responds successfully", async () => {
    mockGeocoding();

    const weatherApi = new WeatherApiProvider();
    const meteosource = new MeteosourceProvider();
    const openMeteo = new OpenMeteoProvider();

    vi.spyOn(weatherApi, "getWeatherByCoordinates").mockResolvedValueOnce(
      makeResult("weatherapi")
    );

    const service = new WeatherService([weatherApi, meteosource, openMeteo]);
    const { response, attempts } = await service.getWeather({ city: "Delhi" });

    expect(response.status).toBe("success");
    expect(response.provider).toBe("weatherapi");
    expect(attempts.length).toBe(1);
    expect(attempts[0].success).toBe(true);
  });

  it("falls back to Meteosource when WeatherAPI fails", async () => {
    mockGeocoding();

    const weatherApi = new WeatherApiProvider();
    const meteosource = new MeteosourceProvider();
    const openMeteo = new OpenMeteoProvider();

    vi.spyOn(weatherApi, "getWeatherByCoordinates").mockRejectedValueOnce(
      new ProviderTimeoutError("weatherapi", "WeatherAPI timed out")
    );
    vi.spyOn(meteosource, "getWeatherByCoordinates").mockResolvedValueOnce(
      makeResult("meteosource")
    );

    const service = new WeatherService([weatherApi, meteosource, openMeteo]);
    const { response, attempts } = await service.getWeather({ city: "Delhi" });

    expect(response.status).toBe("success");
    expect(response.provider).toBe("meteosource");
    expect(attempts.length).toBe(2);
    expect(attempts[0].provider).toBe("weatherapi");
    expect(attempts[0].success).toBe(false);
    expect(attempts[1].provider).toBe("meteosource");
    expect(attempts[1].success).toBe(true);
  });

  it("falls back to Open-Meteo when WeatherAPI and Meteosource both fail", async () => {
    mockGeocoding();

    const weatherApi = new WeatherApiProvider();
    const meteosource = new MeteosourceProvider();
    const openMeteo = new OpenMeteoProvider();

    vi.spyOn(weatherApi, "getWeatherByCoordinates").mockRejectedValueOnce(
      new ProviderUnavailableError("WeatherAPI unavailable")
    );
    vi.spyOn(meteosource, "getWeatherByCoordinates").mockRejectedValueOnce(
      new ProviderResponseError("meteosource", "Meteosource error")
    );
    vi.spyOn(openMeteo, "getWeatherByCoordinates").mockResolvedValueOnce(
      makeResult("open-meteo")
    );

    const service = new WeatherService([weatherApi, meteosource, openMeteo]);
    const { response, attempts } = await service.getWeather({ city: "Delhi" });

    expect(response.status).toBe("success");
    expect(response.provider).toBe("open-meteo");
    expect(attempts.length).toBe(3);
    expect(attempts[0].success).toBe(false);
    expect(attempts[1].success).toBe(false);
    expect(attempts[2].success).toBe(true);
  });

  it("throws ProviderUnavailableError (503) when all three providers fail", async () => {
    mockGeocoding();

    const weatherApi = new WeatherApiProvider();
    const meteosource = new MeteosourceProvider();
    const openMeteo = new OpenMeteoProvider();

    vi.spyOn(weatherApi, "getWeatherByCoordinates").mockRejectedValueOnce(
      new ProviderUnavailableError("WeatherAPI down")
    );
    vi.spyOn(meteosource, "getWeatherByCoordinates").mockRejectedValueOnce(
      new ProviderUnavailableError("Meteosource down")
    );
    vi.spyOn(openMeteo, "getWeatherByCoordinates").mockRejectedValueOnce(
      new ProviderUnavailableError("Open-Meteo down")
    );

    const service = new WeatherService([weatherApi, meteosource, openMeteo]);
    await expect(service.getWeather({ city: "Delhi" })).rejects.toThrow(
      ProviderUnavailableError
    );
  });
});

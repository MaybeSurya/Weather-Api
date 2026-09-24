import { describe, expect, it, vi } from "vitest";
import {
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
} from "@/lib/weather/errors";
import { OpenMeteoProvider } from "@/lib/weather/providers/open-meteo";

describe("OpenMeteoProvider", () => {
  const provider = new OpenMeteoProvider();

  it("normalizes a valid Open-Meteo response into platform taxonomy", async () => {
    const mockApiResponse = {
      latitude: 28.625,
      longitude: 77.25,
      timezone: "Asia/Kolkata",
      current: {
        time: "2026-09-25T03:00:00Z",
        temperature_2m: 24.2,
        apparent_temperature: 25.8,
        relative_humidity_2m: 65,
        wind_speed_10m: 12.4,
        weather_code: 3,
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await provider.getWeatherByCoordinates(
      { latitude: 28.6139, longitude: 77.209 },
      {
        resolvedLocation: {
          city: "Delhi",
          country: "India",
          timezone: "Asia/Kolkata",
        },
      }
    );

    expect(result.provider).toBe("open-meteo");
    expect(result.weather.temperatureCelsius).toBe(24.2);
    expect(result.weather.feelsLikeCelsius).toBe(25.8);
    expect(result.weather.humidityPercent).toBe(65);
    expect(result.weather.windSpeedKmh).toBe(12.4);
    // WMO 3 → overcast → condition_code 3
    expect(result.weather.normalizedCondition).toBe("overcast");
    expect(result.weather.conditionCode).toBe(3);
    expect(result.weather.description).toBe("Overcast");
    expect(result.location.city).toBe("Delhi");
  });

  it("maps WMO clear sky code to 'clear' normalized condition", async () => {
    const mockApiResponse = {
      latitude: 28.625,
      longitude: 77.25,
      timezone: "Asia/Kolkata",
      current: {
        time: "2026-09-25T03:00:00Z",
        temperature_2m: 30,
        apparent_temperature: 32,
        relative_humidity_2m: 40,
        wind_speed_10m: 5,
        weather_code: 0,
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await provider.getWeatherByCoordinates(
      { latitude: 28.6139, longitude: 77.209 }
    );

    expect(result.weather.normalizedCondition).toBe("clear");
    expect(result.weather.conditionCode).toBe(0);
    expect(result.weather.description).toBe("Clear Sky");
  });

  it("throws ProviderRateLimitError on HTTP 429", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Rate limit exceeded", { status: 429 })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderRateLimitError);
  });

  it("throws ProviderUnavailableError on 5xx errors", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 503 })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderUnavailableError);
  });

  it("throws ProviderResponseError on incomplete or invalid payload", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ current: { temperature_2m: "not-a-number" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderResponseError);
  });

  it("throws ProviderResponseError on malformed JSON", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("not json at all", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderResponseError);
  });
});

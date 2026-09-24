import { describe, expect, it, vi } from "vitest";
import {
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
} from "@/lib/weather/errors";
import { WeatherApiProvider } from "@/lib/weather/providers/weatherapi";

describe("WeatherApiProvider", () => {
  const provider = new WeatherApiProvider();

  const mockValidResponse = {
    location: {
      name: "Delhi",
      country: "India",
      tz_id: "Asia/Kolkata",
      lat: 28.6519,
      lon: 77.2315,
    },
    current: {
      temp_c: 32.5,
      feelslike_c: 35.1,
      humidity: 62,
      wind_kph: 11.2,
      condition: {
        code: 1000,
        text: "Sunny",
      },
      last_updated: "2026-09-25 12:00",
    },
  };

  it("normalizes a valid WeatherAPI response into platform taxonomy", async () => {
    process.env.WEATHER_API_KEY = "test-key";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockValidResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await provider.getWeatherByCoordinates(
      { latitude: 28.6519, longitude: 77.2315 },
      {
        resolvedLocation: {
          city: "Delhi",
          country: "India",
          timezone: "Asia/Kolkata",
        },
      }
    );

    expect(result.provider).toBe("weatherapi");
    expect(result.weather.temperatureCelsius).toBe(32.5);
    expect(result.weather.feelsLikeCelsius).toBe(35.1);
    expect(result.weather.humidityPercent).toBe(62);
    expect(result.weather.windSpeedKmh).toBe(11.2);
    // WeatherAPI code 1000 → clear
    expect(result.weather.normalizedCondition).toBe("clear");
    expect(result.weather.conditionCode).toBe(0);
    expect(result.weather.description).toBe("Clear Sky");
    expect(result.location.city).toBe("Delhi");
  });

  it("maps WeatherAPI partly cloudy code to 'partly_cloudy' normalized condition", async () => {
    process.env.WEATHER_API_KEY = "test-key";

    const response = {
      ...mockValidResponse,
      current: {
        ...mockValidResponse.current,
        condition: { code: 1003, text: "Partly cloudy" },
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await provider.getWeatherByCoordinates(
      { latitude: 28.6519, longitude: 77.2315 }
    );

    expect(result.weather.normalizedCondition).toBe("partly_cloudy");
    expect(result.weather.conditionCode).toBe(2);
    expect(result.weather.description).toBe("Partly Cloudy");
  });

  it("maps WeatherAPI thunderstorm code to 'thunderstorm' normalized condition", async () => {
    process.env.WEATHER_API_KEY = "test-key";

    const response = {
      ...mockValidResponse,
      current: {
        ...mockValidResponse.current,
        condition: { code: 1273, text: "Patchy light rain with thunder" },
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await provider.getWeatherByCoordinates(
      { latitude: 28.6519, longitude: 77.2315 }
    );

    expect(result.weather.normalizedCondition).toBe("thunderstorm");
    expect(result.weather.conditionCode).toBe(95);
  });

  it("throws ProviderRateLimitError on HTTP 429", async () => {
    process.env.WEATHER_API_KEY = "test-key";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Rate limit exceeded", { status: 429 })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderRateLimitError);
  });

  it("throws ProviderUnavailableError on HTTP 401", async () => {
    process.env.WEATHER_API_KEY = "test-key";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderUnavailableError);
  });

  it("throws ProviderUnavailableError on HTTP 500", async () => {
    process.env.WEATHER_API_KEY = "test-key";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderUnavailableError);
  });

  it("throws ProviderResponseError on missing required fields", async () => {
    process.env.WEATHER_API_KEY = "test-key";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ location: {}, current: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderResponseError);
  });

  it("throws ProviderResponseError on malformed JSON", async () => {
    process.env.WEATHER_API_KEY = "test-key";

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

  it("throws WeatherError when WEATHER_API_KEY is not set", async () => {
    delete process.env.WEATHER_API_KEY;

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow("WEATHER_API_KEY");
  });
});

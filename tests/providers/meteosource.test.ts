import { describe, expect, it, vi } from "vitest";
import {
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
} from "@/lib/weather/errors";
import { MeteosourceProvider } from "@/lib/weather/providers/meteosource";

describe("MeteosourceProvider", () => {
  const provider = new MeteosourceProvider();

  const mockValidResponse = {
    lat: "28.6519",
    lon: "77.2315",
    timezone: "UTC",
    current: {
      temperature: 29.5,
      feels_like: 31.2,
      humidity: 58,
      wind: { speed: 13.0 },
      icon: "sunny",
    },
  };

  it("normalizes a valid Meteosource response into platform taxonomy", async () => {
    process.env.METEOSOURCE_API_KEY = "test-key";

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

    expect(result.provider).toBe("meteosource");
    expect(result.weather.temperatureCelsius).toBe(29.5);
    expect(result.weather.feelsLikeCelsius).toBe(31.2);
    expect(result.weather.humidityPercent).toBe(58);
    expect(result.weather.windSpeedKmh).toBe(13.0);
    // "sunny" → clear
    expect(result.weather.normalizedCondition).toBe("clear");
    expect(result.weather.conditionCode).toBe(0);
    expect(result.weather.description).toBe("Clear Sky");
    expect(result.location.city).toBe("Delhi");
  });

  it("maps 'rain' icon to 'rain' normalized condition", async () => {
    process.env.METEOSOURCE_API_KEY = "test-key";

    const response = {
      ...mockValidResponse,
      current: { ...mockValidResponse.current, icon: "rain" },
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

    expect(result.weather.normalizedCondition).toBe("rain");
  });

  it("handles missing optional fields gracefully (no wind, no feels_like)", async () => {
    process.env.METEOSOURCE_API_KEY = "test-key";

    const response = {
      ...mockValidResponse,
      current: {
        temperature: 22.0,
        icon: "cloudy",
        // feels_like, wind, humidity absent
      },
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await provider.getWeatherByCoordinates(
      { latitude: 0, longitude: 0 }
    );

    expect(result.weather.temperatureCelsius).toBe(22.0);
    expect(result.weather.feelsLikeCelsius).toBe(22.0); // defaults to temperature
    expect(result.weather.windSpeedKmh).toBe(0); // defaults to 0
    expect(result.weather.humidityPercent).toBe(0); // defaults to 0
    expect(result.weather.normalizedCondition).toBe("cloudy");
  });

  it("throws ProviderRateLimitError on HTTP 429", async () => {
    process.env.METEOSOURCE_API_KEY = "test-key";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Rate limit", { status: 429 })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderRateLimitError);
  });

  it("throws ProviderUnavailableError on HTTP 500", async () => {
    process.env.METEOSOURCE_API_KEY = "test-key";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Server Error", { status: 500 })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderUnavailableError);
  });

  it("throws ProviderResponseError on malformed JSON", async () => {
    process.env.METEOSOURCE_API_KEY = "test-key";

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

  it("throws ProviderResponseError on missing temperature field", async () => {
    process.env.METEOSOURCE_API_KEY = "test-key";

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ current: { humidity: 60 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow(ProviderResponseError);
  });

  it("throws WeatherError when METEOSOURCE_API_KEY is not set", async () => {
    delete process.env.METEOSOURCE_API_KEY;

    await expect(
      provider.getWeatherByCoordinates({ latitude: 0, longitude: 0 })
    ).rejects.toThrow("METEOSOURCE_API_KEY");
  });
});

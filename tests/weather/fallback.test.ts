import { describe, expect, it, vi } from "vitest";
import {
  ProviderResponseError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from "@/lib/weather/errors";
import { MetNoProvider } from "@/lib/weather/providers/met-no";
import { OpenMeteoProvider } from "@/lib/weather/providers/open-meteo";
import { WeatherService } from "@/lib/weather/service";

describe("Provider Failover Sequence (Section 19 & 125)", () => {
  it("falls back to MET Norway when Open-Meteo times out or fails", async () => {
    const openMeteo = new OpenMeteoProvider();
    const metNo = new MetNoProvider();

    // Mock Open-Meteo throwing a timeout
    vi.spyOn(openMeteo, "getWeatherByCoordinates").mockRejectedValueOnce(
      new ProviderTimeoutError("open-meteo", "Timeout")
    );

    // Mock MET Norway succeeding
    vi.spyOn(metNo, "getWeatherByCoordinates").mockResolvedValueOnce({
      provider: "met-no",
      coordinates: { latitude: 28.6139, longitude: 77.209 },
      location: {
        city: "Delhi",
        country: "India",
        timezone: "Asia/Kolkata",
      },
      weather: {
        temperatureCelsius: 22.0,
        feelsLikeCelsius: 23.5,
        humidityPercent: 60,
        windSpeedKmh: 10,
        normalizedCondition: "clear" as const,
        conditionCode: 0,
        description: "Clear Sky",
      },
      timestamp: "2026-09-25T03:00:00.000Z",
    });

    // Mock geocoding search for Delhi
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

    const service = new WeatherService([openMeteo, metNo]);
    const { response, attempts } = await service.getWeather({ city: "Delhi" });

    // Expect response was produced by MET Norway
    expect(response.status).toBe("success");
    expect(response.provider).toBe("met-no");
    expect(response.weather.temperature).toBe("22°C");

    // Expect telemetry records both attempts
    expect(attempts.length).toBe(2);
    expect(attempts[0].provider).toBe("open-meteo");
    expect(attempts[0].success).toBe(false);
    expect(attempts[1].provider).toBe("met-no");
    expect(attempts[1].success).toBe(true);
  });

  it("throws ProviderUnavailableError (503) when all providers in the chain fail", async () => {
    const openMeteo = new OpenMeteoProvider();
    const metNo = new MetNoProvider();

    // Mock both failing
    vi.spyOn(openMeteo, "getWeatherByCoordinates").mockRejectedValueOnce(
      new ProviderTimeoutError("open-meteo", "Timeout")
    );
    vi.spyOn(metNo, "getWeatherByCoordinates").mockRejectedValueOnce(
      new ProviderResponseError("met-no", "Malformed response")
    );

    // Mock geocoding search
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

    const service = new WeatherService([openMeteo, metNo]);
    await expect(service.getWeather({ city: "Delhi" })).rejects.toThrow(
      ProviderUnavailableError
    );
  });
});

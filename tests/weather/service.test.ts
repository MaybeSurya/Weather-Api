import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocationNotFoundError } from "@/lib/weather/errors";
import { buildProviderChain, WeatherService } from "@/lib/weather/service";
import type { IWeatherProvider } from "@/lib/weather/providers/types";

describe("WeatherService Orchestration", () => {
  beforeEach(() => {
    delete process.env.WEATHER_API_KEY;
    delete process.env.METEOSOURCE_API_KEY;
    delete process.env.WEATHER_PROVIDER_PRIMARY;
    delete process.env.WEATHER_PROVIDER_FALLBACKS;
    delete process.env.WEATHER_ENABLE_OPEN_METEO_FALLBACK;
  });

  describe("Safe Provider Chain Defaults (Section 1 & 2)", () => {
    it("defaults to [open-meteo, met-no] when no keys or overrides are set", () => {
      const chain = buildProviderChain();
      const names = chain.map((p) => p.name);
      expect(names).toEqual(["open-meteo", "met-no"]);
    });

    it("defaults to [weatherapi, open-meteo, met-no] when WEATHER_API_KEY is configured", () => {
      process.env.WEATHER_API_KEY = "test-weather-key";
      const chain = buildProviderChain();
      const names = chain.map((p) => p.name);
      expect(names).toEqual(["weatherapi", "open-meteo", "met-no"]);
    });

    it("respects explicit WEATHER_PROVIDER_PRIMARY and WEATHER_PROVIDER_FALLBACKS", () => {
      process.env.WEATHER_PROVIDER_PRIMARY = "meteosource";
      process.env.WEATHER_PROVIDER_FALLBACKS = "open-meteo";
      const chain = buildProviderChain();
      const names = chain.map((p) => p.name);
      expect(names).toEqual(["meteosource", "open-meteo"]);
    });

    it("removes Open-Meteo from the chain when WEATHER_ENABLE_OPEN_METEO_FALLBACK=false", () => {
      process.env.WEATHER_ENABLE_OPEN_METEO_FALLBACK = "false";
      const chain = buildProviderChain();
      const names = chain.map((p) => p.name);
      expect(names).toEqual(["met-no"]);
    });
  });

  describe("Response Formatting and Schema", () => {
    it("formats weather results according to the public schema", async () => {
      const mockProvider: IWeatherProvider = {
        name: "open-meteo",
        async getWeatherByCoordinates(coords, context) {
          return {
            provider: "open-meteo",
            coordinates: coords,
            location: context?.resolvedLocation ?? {
              city: "Aligarh",
              country: "India",
              timezone: "Asia/Kolkata",
            },
            weather: {
              temperatureCelsius: 24.3,
              feelsLikeCelsius: 25.7,
              humidityPercent: 65,
              windSpeedKmh: 12.2,
              normalizedCondition: "overcast" as const,
              conditionCode: 3,
              description: "Overcast",
            },
            timestamp: "2026-09-25T03:00:00.000Z",
          };
        },
      };

      const service = new WeatherService([mockProvider]);
      const { response } = await service.getWeather({
        headers: new Headers(), // no city, no CF headers -> fallback
      });

      expect(response.status).toBe("success");
      expect(response.provider).toBe("open-meteo");
      expect(response.location.city).toBe("Aligarh");
      expect(response.weather.temperature).toBe("24°C");
      expect(response.weather.feels_like).toBe("26°C");
      expect(response.weather.humidity).toBe("65%");
      expect(response.weather.wind_speed).toBe("12 km/h");
      expect(response.weather.condition_code).toBe(3);
      expect(response.weather.description).toBe("Overcast");
      expect(response.meta.cached).toBe(false);
    });

    it("fails fast with LocationNotFoundError when city geocoding fails without attempting weather providers", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const providerSpy = vi.fn();
      const mockProvider: IWeatherProvider = {
        name: "open-meteo",
        getWeatherByCoordinates: providerSpy,
      };

      const service = new WeatherService([mockProvider]);
      await expect(service.getWeather({ city: "NonExistentPlaceXYZ123" })).rejects.toThrow(
        LocationNotFoundError
      );
      expect(providerSpy).not.toHaveBeenCalled();
    });
  });
});

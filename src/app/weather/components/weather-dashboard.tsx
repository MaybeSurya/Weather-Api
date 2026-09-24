"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PublicWeatherResponse,
  PublicWeatherSuccessResponse,
} from "@/lib/weather/types";
import { WeatherCard } from "./weather-card";
import { WeatherSearch } from "./weather-search";
import { WeatherSkeleton } from "./weather-skeleton";

/**
 * Primary weather application component.
 * Consumes /api/weather — never calls upstream providers directly.
 * All presentation logic is isolated here; no provider-specific code.
 */
export function WeatherDashboard() {
  const [data, setData] = useState<PublicWeatherSuccessResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const hasMounted = useRef(false);

  const fetchWeather = useCallback(async (city: string | null) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveCity(city);

    try {
      const url = city
        ? `/api/weather?city=${encodeURIComponent(city)}`
        : `/api/weather`;

      const response = await fetch(url);
      const json = (await response.json()) as PublicWeatherResponse;

      if (response.ok && json.status === "success") {
        setData(json);
      } else if (json.status === "error") {
        // Translate structured API errors into concise user-facing messages
        const code = json.error.code;
        if (code === "INVALID_CITY" || code === "INVALID_QUERY") {
          setErrorMessage("Couldn't find that place. Try another city or check the spelling.");
        } else if (code === "RATE_LIMIT_EXCEEDED") {
          setErrorMessage("Too many requests. Please wait a moment and try again.");
        } else if (code === "SERVICE_UNAVAILABLE") {
          setErrorMessage("Weather service is temporarily unavailable. Please try again shortly.");
        } else {
          setErrorMessage("Something went wrong. Please try again.");
        }
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-detect location on first mount
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      fetchWeather(null);
    }
  }, [fetchWeather]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">
      {/* Search */}
      <WeatherSearch
        onSearch={(city) => fetchWeather(city)}
        isLoading={isLoading}
        currentCity={activeCity ?? undefined}
      />

      {/* Weather Result */}
      <section aria-live="polite" aria-atomic="true">
        {isLoading && !data ? (
          <WeatherSkeleton />
        ) : errorMessage ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 py-12 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchWeather(activeCity)}
              className="px-4 py-1.5 text-xs font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        ) : data ? (
          <WeatherCard data={data} />
        ) : null}
      </section>
    </div>
  );
}

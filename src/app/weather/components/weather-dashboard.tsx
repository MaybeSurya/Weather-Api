"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  PublicWeatherResponse,
  PublicWeatherSuccessResponse,
} from "@/lib/weather/types";
import { WeatherBento } from "./weather-bento";
import { WeatherSearchModal } from "./weather-search-modal";
import { DeveloperSection } from "./developer-section";
import { WeatherSkeleton } from "./weather-skeleton";
import { WeatherErrorConsole } from "./weather-error";
import { WeatherIcon } from "./weather-icon";

export function WeatherDashboard() {
  const [data, setData] = useState<PublicWeatherSuccessResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string>("Rudrapur");
  const [isMetric, setIsMetric] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeNavTab, setActiveNavTab] = useState<string>("overview");
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number; country?: string } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("India")) {
        return { latitude: 28.9800, longitude: 79.4000, country: "India" };
      }
    } catch {
      // ignore
    }
    return null;
  });

  const hasMounted = useRef(false);

  const fetchWeather = useCallback(async (city: string | null) => {
    setIsLoading(true);
    setErrorMessage(null);
    if (city) setActiveCity(city);

    try {
      const url = city
        ? `/api/weather?city=${encodeURIComponent(city)}`
        : `/api/weather?city=Rudrapur`;

      const response = await fetch(url);
      const json = (await response.json()) as PublicWeatherResponse;

      if (response.ok && json.status === "success") {
        setData(json);
        if (json.location?.city) {
          setActiveCity(json.location.city);
        }
      } else if (json.status === "error") {
        const code = json.error.code;
        if (code === "INVALID_CITY" || code === "INVALID_QUERY") {
          setErrorMessage(
            `We couldn't find "${city || "that location"}". Please check the spelling or try another city.`
          );
        } else if (code === "RATE_LIMIT_EXCEEDED") {
          setErrorMessage("Too many requests. Please wait a few seconds and try again.");
        } else {
          setErrorMessage("Weather data is temporarily unavailable. Please try again.");
        }
      } else {
        setErrorMessage("An unexpected issue occurred while loading weather data.");
      }
    } catch {
      setErrorMessage("Could not connect to weather server. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      fetchWeather("Rudrapur");
    }
  }, [fetchWeather]);

  // Approximate browser geolocation detection for smart relevance in search
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // If denied, fallback coordinates remain active
        },
        { timeout: 8000, maximumAge: 600000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Derived effective coordinates (prefers detected userCoords, then active weather location)
  const effectiveUserCoords =
    userCoords ??
    (data?.coordinates
      ? {
          latitude: data.coordinates.latitude,
          longitude: data.coordinates.longitude,
          country: data.location?.country,
        }
      : null);

  return (
    <div className="min-h-screen flex flex-col bg-surface-container-lowest text-on-surface antialiased relative overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
      {/* Ambient Atmospheric Backdrop Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" id="sky-backdrop">
        <div className="absolute -top-[180px] left-1/2 -translate-x-1/2 w-[980px] h-[480px] bg-primary-container/10 blur-[130px] rounded-full sky-glow-primary" />
        <div className="absolute top-[380px] -left-[200px] w-[520px] h-[520px] bg-secondary-container/15 blur-[140px] rounded-full sky-glow-secondary" />
        <div className="absolute bottom-[100px] right-[-100px] w-[600px] h-[600px] bg-primary/5 blur-[160px] rounded-full" />
      </div>

      {/* Header Navigation (80px height matching reference screenshot) */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-2xl border-b border-white/[0.04] shadow-[0_1px_8px_rgba(0,0,0,0.4)] transition-all">
        <div className="h-20 max-w-[1240px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors shadow-[0_0_16px_rgba(56,189,248,0.15)]">
                <WeatherIcon name="cloud" className="w-5 h-5 text-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-[17px] font-semibold text-on-surface tracking-tight group-hover:text-primary transition-colors">
                  MaybeSurya Weather
                </span>
                <span className="text-[11px] font-semibold text-primary">
                  Live Weather &amp; Forecasts
                </span>
              </div>
            </Link>

            {/* Pill Navigation Menu */}
            <nav className="hidden lg:flex items-center bg-surface-container-low/80 p-1 rounded-xl border border-white/[0.04]">
              <button
                type="button"
                onClick={() => {
                  setActiveNavTab("overview");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeNavTab === "overview"
                    ? "bg-surface-container-highest text-on-surface shadow-inner"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveNavTab("hourly");
                  document.getElementById("hourly-forecast")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeNavTab === "hourly"
                    ? "bg-surface-container-highest text-on-surface shadow-inner"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Hourly Forecast
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveNavTab("air-quality");
                  document.getElementById("air-quality")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeNavTab === "air-quality"
                    ? "bg-surface-container-highest text-on-surface shadow-inner"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                Air Quality
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Search Locations
              </button>
            </nav>
          </div>

          {/* Search Trigger Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between pl-3 pr-2 py-2 bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface rounded-xl transition-all border border-white/[0.04] text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-on-surface-variant">
                <WeatherIcon name="search" className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="truncate">
                  {data?.location?.city ? `${data.location.city}, ${data.location.country}` : "Search city or airport..."}
                </span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container-highest text-outline font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Metric / Imperial Unit Toggle */}
            <div className="flex items-center bg-surface-container-high/70 p-1 rounded-lg border border-white/[0.04] text-xs font-mono">
              <button
                type="button"
                onClick={() => setIsMetric(true)}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  isMetric
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setIsMetric(false)}
                className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                  !isMetric
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                °F
              </button>
            </div>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 rounded-xl bg-surface-container-high text-on-surface hover:text-white cursor-pointer"
              aria-label="Search"
            >
              <WeatherIcon name="search" className="w-4 h-4" />
            </button>

            {/* API Docs Button */}
            <a
              href="https://docs.maybesurya.dev/weather/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-semibold transition-colors"
            >
              <WeatherIcon name="code" className="w-4 h-4 text-primary" />
              <span>API Docs</span>
            </a>

            {/* Profile Avatar Circle */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm text-on-primary">
              <WeatherIcon name="user" className="w-4 h-4 text-on-primary" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 pb-20 flex-1 relative z-10 flex flex-col gap-6">
        {isLoading && !data ? (
          <WeatherSkeleton />
        ) : errorMessage ? (
          <WeatherErrorConsole
            city={activeCity}
            errorMessage={errorMessage}
            onRetry={() => fetchWeather(activeCity)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onSelectCity={(city) => fetchWeather(city)}
          />
        ) : data ? (
          <>
            <WeatherBento
              data={data}
              isMetric={isMetric}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
            <DeveloperSection data={data} activeCity={activeCity} />
          </>
        ) : null}
      </main>

      {/* Enhanced Footer with Animated Watermark & Interactive Controls */}
      <footer className="relative w-full bg-surface-container-lowest/95 backdrop-blur-xl border-t border-white/[0.04] mt-auto shadow-[0_-4px_24px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 pt-10 pb-4">
          {/* Interactive Controls Bar: Quick Cities, Units & Refresh */}
          <div className="pb-6 mb-8 border-b border-white/[0.04] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs">
            {/* Quick Cities */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-outline font-medium flex items-center gap-1.5 mr-1">
                <WeatherIcon name="location_on" className="w-4 h-4 text-primary" />
                <span>Quick Cities:</span>
              </span>
              {["Rudrapur", "Dehradun", "New Delhi", "London", "Tokyo", "New York", "Paris"].map((c) => {
                const isActive = activeCity.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      fetchWeather(c);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      isActive
                        ? "bg-primary text-slate-900 font-bold shadow-md shadow-primary/25 ring-1 ring-primary"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-white"
                    }`}
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping" />}
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fetchWeather(activeCity)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                title="Refresh current city forecast"
              >
                <WeatherIcon
                  name="cloud_sync"
                  className={`w-3.5 h-3.5 text-primary ${isLoading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMetric(!isMetric)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-all cursor-pointer active:scale-95"
                title="Switch Temperature Units"
              >
                <span className="font-bold text-primary font-mono">{isMetric ? "°C" : "°F"}</span>
                <span>Switch to {isMetric ? "°F" : "°C"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-all cursor-pointer active:scale-95"
              >
                <WeatherIcon name="search" className="w-3.5 h-3.5 text-primary" />
                <span>Search City</span>
              </button>

              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-xs font-semibold text-primary hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
              >
                <span>Top</span>
                <WeatherIcon name="arrow_forward" className="w-3.5 h-3.5 -rotate-90" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8">
            {/* Col 1: Brand & Plain English description */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <WeatherIcon name="cloud" className="w-5 h-5" />
                </div>
                <span className="font-display font-semibold text-on-surface tracking-tight text-base">
                  Maybesurya Weather
                </span>
              </div>
              <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
                Simple, accurate, and real-time weather forecasts, 24-hour hourly outlooks, and easy-to-read live conditions for cities worldwide.
              </p>
              {/* Mandatory Provider Attribution */}
              <div className="pt-2 text-xs text-on-surface-variant leading-relaxed">
                <span className="text-on-surface font-semibold">Weather Data Sources:</span>{" "}
                Powered by{" "}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Open-Meteo
                </a>{" "}
                (licensed under{" "}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  CC BY 4.0
                </a>
                ),{" "}
                <a
                  href="https://www.met.no/en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  MET Norway
                </a>
                , and{" "}
                <a
                  href="https://www.weatherapi.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  WeatherAPI
                </a>
                .
              </div>
            </div>

            {/* Col 2: Resources */}
            <div className="flex flex-col gap-2 text-xs">
              <span className="font-bold text-outline uppercase tracking-wider text-[11px] mb-1">
                Explore
              </span>
              <a
                href="https://weather.maybesurya.dev/api/weather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Weather REST API
              </a>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="text-left text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                Search Any City
              </button>
              <a
                href="https://docs.maybesurya.dev/weather/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Documentation
              </a>
            </div>

            {/* Col 3: Links */}
            <div className="flex flex-col gap-2 text-xs">
              <span className="font-bold text-outline uppercase tracking-wider text-[11px] mb-1">
                Project &amp; Code
              </span>
              <a
                href="https://github.com/MaybeSurya/Weather-Api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-2 group/star"
              >
                <span>GitHub Repo</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-medium border border-amber-400/20 group-hover/star:bg-amber-400/20 transition-all">
                  <span>⭐</span>
                  <span>Leave a star</span>
                </span>
              </a>
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Open-Meteo Project
              </a>
              <a
                href="https://www.met.no/en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                MET Norway Open Data
              </a>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-outline">
            <div className="flex flex-wrap items-center gap-2">
              <span>© {new Date().getFullYear()} MaybeSurya Weather.</span>
              <span className="text-on-surface-variant font-medium">
                Made with <span className="text-rose-500 animate-pulse inline-block">❤️</span> by{" "}
                <a
                  href="https://github.com/maybesurya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  MaybeSurya
                </a>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/maybesurya"
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5"
              >
                <WeatherIcon name="terminal" className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
              <a
                href="https://weather.maybesurya.dev/api/weather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1.5"
              >
                <WeatherIcon name="globe" className="w-3.5 h-3.5" />
                <span>API</span>
              </a>
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <WeatherIcon name="cloud_sync" className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Updates</span>
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Animated Footer Watermark */}
        <div className="relative w-full overflow-hidden select-none flex flex-col items-center justify-center pt-4 pb-2 border-t border-white/[0.02]">
          <a
            href="https://github.com/maybesurya"
            target="_blank"
            rel="noopener noreferrer"
            className="group cursor-pointer flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-[1.02]"
            aria-label="Created by maybesurya on GitHub"
          >
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container/80 border border-white/[0.06] text-xs text-on-surface-variant group-hover:text-primary group-hover:border-primary/30 transition-all duration-300 shadow-sm backdrop-blur-md mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>Crafted with love by maybesurya</span>
              <WeatherIcon name="arrow_forward" className="w-3.5 h-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
            </div>

            <span className="text-[12vw] sm:text-[13vw] font-black tracking-tighter uppercase whitespace-nowrap bg-gradient-to-r from-sky-400 via-primary via-indigo-400 to-sky-300 bg-clip-text text-transparent animate-watermark group-hover:brightness-125 transition-all duration-500 drop-shadow-[0_0_30px_rgba(56,189,248,0.15)]">
              MAYBESURYA
            </span>
          </a>
        </div>
      </footer>

      {/* Global Cmd+K Search Modal with Smart Location Ranking */}
      <WeatherSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCity={(city) => fetchWeather(city)}
        userCoords={effectiveUserCoords}
      />
    </div>
  );
}

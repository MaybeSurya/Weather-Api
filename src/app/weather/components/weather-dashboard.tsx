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

type AtmosphereMode = "auto" | "clear" | "rain" | "night";

export function WeatherDashboard() {
  const [data, setData] = useState<PublicWeatherSuccessResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string>("Rudrapur");
  const [isMetric, setIsMetric] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [atmosphere, setAtmosphere] = useState<AtmosphereMode>("auto");

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
            `Unable to locate "${city || "requested city"}". Please verify the spelling or select a major coordinate.`
          );
        } else if (code === "RATE_LIMIT_EXCEEDED") {
          setErrorMessage("Rate limit reached. Please wait a moment and try again.");
        } else {
          setErrorMessage("Atmospheric telemetry temporarily unavailable. Please retry.");
        }
      } else {
        setErrorMessage("An unexpected fault occurred while fetching weather.");
      }
    } catch {
      setErrorMessage("Network signal lost. Please check your internet connection.");
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

  // Derive atmospheric background colors
  const activeMode: "clear" | "rain" | "night" = (() => {
    if (atmosphere !== "auto") return atmosphere;
    if (!data) return "clear";
    const desc = data.weather.description.toLowerCase();
    if (
      desc.includes("rain") ||
      desc.includes("drizzle") ||
      desc.includes("shower") ||
      desc.includes("storm")
    ) {
      return "rain";
    }
    if (desc.includes("night")) {
      return "night";
    }
    return "clear";
  })();

  const skyGlow1 = (() => {
    if (activeMode === "rain") {
      return "from-blue-700/25 to-slate-800/20";
    }
    if (activeMode === "night") {
      return "from-indigo-950/40 to-slate-900/30";
    }
    return "from-sky-500/15 to-blue-600/5";
  })();

  const skyGlow2 = (() => {
    if (activeMode === "rain") {
      return "from-cyan-600/20 to-blue-900/15";
    }
    if (activeMode === "night") {
      return "from-purple-950/30 to-blue-950/20";
    }
    return "from-indigo-500/10 to-amber-500/5";
  })();

  return (
    <div className="min-h-screen flex flex-col relative text-slate-100 selection:bg-sky-500/30 selection:text-sky-200">
      {/* Atmospheric Sky Gradient Backdrop (Apple Weather Natural Lighting) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" id="sky-backdrop">
        <div
          className={`absolute -top-32 left-1/4 w-[750px] h-[550px] rounded-full bg-gradient-to-b ${skyGlow1} blur-[120px] sky-glow-primary transition-all duration-1000`}
        />
        <div
          className={`absolute top-96 -right-20 w-[600px] h-[500px] rounded-full bg-gradient-to-b ${skyGlow2} blur-[140px] sky-glow-secondary transition-all duration-1000`}
        />

        {/* Rain Pattern Layer (Monsoon & Rain State from Stitch) */}
        {activeMode === "rain" && (
          <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="rain-drops"
                width="30"
                height="40"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(18)"
              >
                <line
                  x1="2"
                  y1="2"
                  x2="2"
                  y2="16"
                  stroke="#8ed5ff"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                <line
                  x1="18"
                  y1="18"
                  x2="18"
                  y2="34"
                  stroke="#8ed5ff"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rain-drops)" />
          </svg>
        )}
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#0b111e]/75 backdrop-blur-2xl border-b border-white/[0.06] transition-all">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <span className="material-symbols-outlined text-white text-[19px]">
                  cloud
                </span>
              </div>
              <span className="font-display font-semibold text-[17px] tracking-tight text-white">
                Maybesurya <span className="text-sky-400 font-normal">Weather</span>
              </span>
            </Link>
          </div>

          {/* Quick Search Bar (Command Palette Trigger) */}
          <div className="flex-1 max-w-md hidden sm:block">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-slate-400 hover:text-slate-200 transition-all text-sm group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-sky-400 transition-colors">
                  search
                </span>
                <span>Search city or airport...</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 font-mono text-[10px] text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Controls: Atmosphere Switcher & Units Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Weather Atmosphere Preview Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
              <button
                type="button"
                onClick={() => setAtmosphere("clear")}
                className={`weather-tab px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  activeMode === "clear"
                    ? "text-white bg-white/10 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[15px] text-amber-400"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  wb_sunny
                </span>
                <span className="hidden sm:inline">Clear</span>
              </button>

              <button
                type="button"
                onClick={() => setAtmosphere("rain")}
                className={`weather-tab px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  activeMode === "rain"
                    ? "text-white bg-white/10 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-sky-400">
                  rainy
                </span>
                <span className="hidden sm:inline">Rain</span>
              </button>

              <button
                type="button"
                onClick={() => setAtmosphere("night")}
                className={`weather-tab px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  activeMode === "night"
                    ? "text-white bg-white/10 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-indigo-400">
                  bedtime
                </span>
                <span className="hidden sm:inline">Night</span>
              </button>
            </div>

            <div className="h-4 w-px bg-white/10 hidden md:block" />

            {/* Metric / Imperial Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium">
              <button
                type="button"
                onClick={() => setIsMetric(true)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  isMetric
                    ? "bg-white/10 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setIsMetric(false)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                  !isMetric
                    ? "bg-white/10 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                °F
              </button>
            </div>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white cursor-pointer"
              aria-label="Search"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>

            {/* API Docs Link */}
            <a
              href="https://docs.maybesurya.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[15px] text-sky-400">
                code
              </span>
              <span>API Docs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 flex-1 relative z-10 flex flex-col gap-8">
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

      {/* Clean Minimal Footer */}
      <footer className="w-full bg-[#080c16]/90 border-t border-white/[0.06] py-8 text-xs text-slate-400 relative z-10">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-display font-medium text-slate-300">
              Maybesurya Weather
            </span>
            <span className="text-slate-600">·</span>
            <span>Crafted for clarity, accuracy, and speed.</span>
          </div>
          <div className="flex items-center gap-5 font-medium">
            <a
              href="https://docs.maybesurya.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Documentation
            </a>
            <a
              href="https://apis.maybesurya.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              APIs
            </a>
            <a
              href="https://github.com/maybesurya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* Global Cmd+K Search Modal */}
      <WeatherSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCity={(city) => fetchWeather(city)}
      />
    </div>
  );
}

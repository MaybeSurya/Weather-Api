"use client";

import { WeatherIcon } from "./weather-icon";

interface WeatherErrorProps {
  city: string;
  errorMessage: string;
  onRetry: () => void;
  onOpenSearch: () => void;
  onSelectCity: (city: string) => void;
}

const POPULAR_CITIES = [
  { name: "New Delhi", temp: "28°C" },
  { name: "London", temp: "14°C" },
  { name: "Tokyo", temp: "19°C" },
  { name: "New York", temp: "17°C" },
  { name: "Bengaluru", temp: "24°C" },
];

export function WeatherErrorConsole({
  city,
  errorMessage,
  onRetry,
  onOpenSearch,
  onSelectCity,
}: WeatherErrorProps) {
  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      {/* Top Context Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1 text-on-surface-variant text-xs">
        <div className="flex items-center gap-1.5">
          <WeatherIcon name="warning" className="w-4 h-4 text-amber-400" />
          <span className="font-medium">
            Location Not Found
          </span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Weather Service: Online</span>
        </div>
      </div>

      {/* Main Error Card */}
      <div className="relative w-full rounded-2xl bg-surface-container-low shadow-xl p-6 sm:p-12 overflow-hidden border border-white/[0.04]">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center">
          {/* Animated Offline Icon Graphic */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center shadow-inner relative">
              <svg
                className="absolute inset-0 w-full h-full text-outline-variant/30 animate-spin"
                fill="none"
                style={{ animationDuration: "20s" }}
                viewBox="0 0 112 112"
              >
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeDasharray="4 6" strokeWidth="1.5" />
                <circle cx="56" cy="56" r="32" stroke="currentColor" strokeDasharray="2 4" strokeWidth="1" />
              </svg>

              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-surface-container-high text-primary shadow-md">
                <WeatherIcon name="cloud_off" className="w-7 h-7 text-primary" />
              </div>
            </div>
          </div>

          {/* Simple Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-amber-400 text-xs font-semibold mb-4 shadow-sm">
            <span>Location Unresolved</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-on-surface tracking-tight mb-2">
            Location Not Found
          </h1>

          {/* Subtext */}
          <p className="text-on-surface-variant text-sm max-w-lg mb-6 leading-relaxed">
            {errorMessage ? (
              errorMessage
            ) : (
              <>
                We couldn&apos;t find weather records for{" "}
                <span className="text-primary font-medium">&ldquo;{city}&rdquo;</span>.
                Please check the spelling, enter an airport code, or choose from popular cities below.
              </>
            )}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-8">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-slate-900 font-semibold text-sm hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <WeatherIcon name="search" className="w-4 h-4" />
              <span>Search Another City</span>
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium text-sm transition-all shadow-sm cursor-pointer"
            >
              <WeatherIcon name="navigation" className="w-4 h-4 text-primary" />
              <span>Use Current Location</span>
            </button>
          </div>

          {/* Popular Cities */}
          <div className="w-full pt-4 border-t border-white/[0.04]">
            <span className="block text-xs font-semibold text-outline uppercase tracking-wider mb-3">
              Popular Cities &amp; Places
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {POPULAR_CITIES.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => onSelectCity(item.name)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-all group shadow-sm cursor-pointer"
                >
                  <WeatherIcon name="location_on" className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.name}</span>
                  <span className="text-on-surface-variant font-mono">{item.temp}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Ribbon inside card */}
        <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-outline text-xs font-mono bg-surface-container-lowest/50 p-4 rounded-xl border border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-on-surface-variant font-medium font-sans">
              Weather Service: Online &amp; Ready
            </span>
          </div>
          <span className="text-primary font-sans">Instant Worldwide Search</span>
        </div>
      </div>

      {/* Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Worldwide Search Card */}
        <div className="rounded-2xl bg-surface-container-low p-6 flex flex-col justify-between shadow-lg border border-white/[0.04]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <WeatherIcon name="globe" className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold text-on-surface text-base">Worldwide Weather Coverage</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              Get real-time forecasts, 24-hour hourly outlooks, and 7-day weather predictions for over 200,000 cities and towns across the globe.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-fit text-xs font-semibold text-primary hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Open Search Window</span>
            <WeatherIcon name="arrow_forward" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Guidance Card */}
        <div className="rounded-2xl bg-surface-container-low p-6 flex flex-col justify-between shadow-lg border border-white/[0.04]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <WeatherIcon name="lightbulb" className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold text-on-surface text-base">Search Tips</span>
            </div>
            <ul className="text-xs text-on-surface-variant space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Type city names directly, e.g. &ldquo;London&rdquo;, &ldquo;Tokyo&rdquo;, or &ldquo;New Delhi&rdquo;.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Airport codes like DEL, JFK, or LHR work instantly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>You can search any major city, town, or state worldwide.</span>
              </li>
            </ul>
          </div>
          <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs">
            <span className="text-outline">Need API access?</span>
            <a
              href="https://weather.maybesurya.dev/api/weather"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>Developer API</span>
              <WeatherIcon name="arrow_forward" className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

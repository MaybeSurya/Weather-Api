"use client";

import type { PublicWeatherSuccessResponse } from "@/lib/weather/types";
import { WeatherIcon } from "./weather-icon";

interface WeatherCardProps {
  data: PublicWeatherSuccessResponse;
}

/**
 * WeatherCard — Premium glassmorphic weather display.
 * Features condition-aware atmospheric background glow, animated typography,
 * interactive metric cards with micro-hover lifts, and clean live timestamps.
 */
export function WeatherCard({ data }: WeatherCardProps) {
  const { location, weather, provider, meta } = data;

  const updatedLabel = (() => {
    const ts = new Date(meta.timestamp);
    if (isNaN(ts.getTime())) return "Updated recently";
    const hours = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `Updated at ${hours}`;
  })();

  const desc = weather.description.toLowerCase();

  // Condition-tailored ambient aura glow
  const auraGlow = (() => {
    if (desc.includes("rain") || desc.includes("drizzle") || desc.includes("shower")) {
      return "from-sky-500/15 via-blue-500/5 to-transparent";
    }
    if (desc.includes("thunder") || desc.includes("storm")) {
      return "from-indigo-600/20 via-purple-500/10 to-transparent";
    }
    if (desc.includes("snow") || desc.includes("ice")) {
      return "from-cyan-300/15 via-sky-400/5 to-transparent";
    }
    if (desc.includes("clear") || desc.includes("sunny")) {
      return "from-amber-400/15 via-yellow-500/5 to-transparent";
    }
    return "from-white/10 via-slate-400/5 to-transparent";
  })();

  return (
    <div className="relative group w-full">
      {/* Dynamic ambient atmospheric backlight glow */}
      <div
        className={`absolute -inset-1.5 rounded-3xl bg-gradient-to-br ${auraGlow} blur-2xl opacity-60 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none`}
        aria-hidden="true"
      />

      <div className="
        relative w-full rounded-3xl
        bg-[#11141d]/85 backdrop-blur-2xl
        border border-white/10 group-hover:border-white/20
        p-7 sm:p-10 space-y-8
        shadow-2xl shadow-black/80
        transition-all duration-300
      ">
        {/* Header: Location & Live badge */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-white/5 text-white/50">
                <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                {location.city}
              </h2>
            </div>
            {location.country && (
              <p className="text-sm text-white/50 mt-1 pl-7 font-medium">{location.country}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Temperature Hero + Animated Icon */}
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <div
              className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter text-white leading-none select-none"
              aria-label={`Temperature: ${weather.temperature}`}
            >
              {weather.temperature}
            </div>
            <p className="text-lg sm:text-xl text-white/80 mt-3 font-medium flex items-center gap-2">
              <span>{weather.description}</span>
            </p>
          </div>

          <div className="flex-shrink-0 transform group-hover:scale-110 transition-transform duration-500" aria-hidden="true">
            <WeatherIcon description={weather.description} className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28" />
          </div>
        </div>

        {/* Metric Cards with hover lift and icons */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-1">
          {/* Feels like */}
          <div className="
            bg-white/[0.03] hover:bg-white/[0.06] border border-white/6 hover:border-white/15
            rounded-2xl p-4 sm:p-5
            transform hover:-translate-y-1 transition-all duration-200
          ">
            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5 font-medium">
              <svg className="w-3.5 h-3.5 text-amber-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Feels like</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{weather.feels_like}</div>
          </div>

          {/* Humidity */}
          <div className="
            bg-white/[0.03] hover:bg-white/[0.06] border border-white/6 hover:border-white/15
            rounded-2xl p-4 sm:p-5
            transform hover:-translate-y-1 transition-all duration-200
          ">
            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5 font-medium">
              <svg className="w-3.5 h-3.5 text-sky-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>Humidity</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{weather.humidity}</div>
          </div>

          {/* Wind Speed */}
          <div className="
            bg-white/[0.03] hover:bg-white/[0.06] border border-white/6 hover:border-white/15
            rounded-2xl p-4 sm:p-5
            transform hover:-translate-y-1 transition-all duration-200
          ">
            <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5 font-medium">
              <svg className="w-3.5 h-3.5 text-teal-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>Wind</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{weather.wind_speed}</div>
          </div>
        </div>

        {/* Footer: timestamp + provider attribution pill */}
        <div className="flex items-center justify-between text-xs text-white/35 pt-2 border-t border-white/5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 inline-block" />
            {updatedLabel}
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white/[0.04] text-white/40 border border-white/5 uppercase">
            {provider}
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { WeatherIcon } from "./weather-icon";

interface WeatherErrorProps {
  city: string;
  errorMessage: string;
  onRetry: () => void;
  onOpenSearch: () => void;
  onSelectCity: (city: string) => void;
}

const OBSERVATORY_NODES = [
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
      {/* Top Metadata / Context Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1 text-outline font-mono text-xs">
        <div className="flex items-center gap-1.5">
          <WeatherIcon name="warning" className="w-4 h-4 text-tertiary" />
          <span className="uppercase tracking-wider">
            TELEMETRY FAULT: GEO-RESOLUTION CODE 404
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-on-surface-variant flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
            Node: Earth-Direct-IX
          </span>
          <span className="hidden sm:inline text-outline-variant">/</span>
          <span className="hidden sm:inline text-on-surface-variant uppercase tracking-wider text-[11px]">
            LAT: 00°00&apos;N LON: 00°00&apos;W
          </span>
        </div>
      </div>

      {/* Main Empathic Error Console Card */}
      <div className="relative w-full rounded-2xl bg-surface-container-low shadow-xl p-6 sm:p-12 overflow-hidden border border-white/[0.04]">
        {/* Ambient Glow Spots */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-container/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -top-24 right-0 w-72 h-72 bg-tertiary-container/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center">
          {/* Radar Pulse Graphic / Weather Offline Monogram */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-surface-container flex items-center justify-center shadow-inner relative">
              {/* Animated Scan Concentric Rings */}
              <svg
                className="absolute inset-0 w-full h-full text-outline-variant/40 animate-spin"
                fill="none"
                style={{ animationDuration: "16s" }}
                viewBox="0 0 112 112"
              >
                <circle cx="56" cy="56" r="50" stroke="currentColor" strokeDasharray="4 6" strokeWidth="1.5" />
                <circle cx="56" cy="56" r="34" stroke="currentColor" strokeDasharray="2 4" strokeWidth="1" />
                <circle cx="56" cy="56" r="18" stroke="currentColor" strokeDasharray="2 2" strokeWidth="1" />
              </svg>

              {/* Center Glyph */}
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high text-primary shadow-md">
                <WeatherIcon name="cloud_off" className="w-8 h-8 text-primary" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-tertiary text-on-tertiary items-center justify-center text-[10px] font-bold">
                    !
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Pill Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-tertiary text-[11px] font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <WeatherIcon name="radar" className="w-3.5 h-3.5" />
            <span>Atmospheric Signal Unresolved</span>
          </div>

          {/* Primary Headline */}
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-on-surface tracking-tight mb-2">
            Location Not Found
          </h1>

          {/* Explanatory Subtext */}
          <p className="text-on-surface-variant text-sm max-w-lg mb-6 leading-relaxed">
            {errorMessage ? (
              errorMessage
            ) : (
              <>
                We couldn&apos;t find atmospheric telemetry records for{" "}
                <span className="text-primary font-medium">&ldquo;{city}&rdquo;</span>.
                Check the spelling, enter an IATA/ICAO airport code, or select an active observatory node below.
              </>
            )}
          </p>

          {/* Recovery CTA Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-8">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-container text-on-primary-container font-semibold text-sm hover:opacity-95 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <WeatherIcon name="search" className="w-5 h-5" />
              <span>Try Another Search</span>
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium text-sm transition-all shadow-sm cursor-pointer"
            >
              <WeatherIcon name="navigation" className="w-5 h-5 text-primary" />
              <span>Use Current Location</span>
            </button>
          </div>

          {/* Popular Locations Segment */}
          <div className="w-full pt-4 border-t border-white/[0.04]">
            <span className="block text-[11px] font-semibold text-outline uppercase tracking-wider mb-3">
              Active Observatory Nodes &amp; Major Coordinates
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {OBSERVATORY_NODES.map((node) => (
                <button
                  key={node.name}
                  type="button"
                  onClick={() => onSelectCity(node.name)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-all group shadow-sm cursor-pointer"
                >
                  <WeatherIcon name="location_on" className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{node.name}</span>
                  <span className="text-on-surface-variant font-mono">{node.temp}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostic Status Ribbon inside error card */}
        <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-outline text-xs font-mono bg-surface-container-lowest/50 p-4 rounded-xl border border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container" />
            <span className="text-on-surface-variant font-medium">
              Core API Service: Fully Operational
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>HTTP 404 Cached Resolution</span>
            <span className="text-outline-variant">|</span>
            <span>Edge TTL: 120s</span>
            <span className="text-outline-variant">|</span>
            <span className="text-primary font-mono">SYS_ID: #MS-7712</span>
          </div>
        </div>
      </div>

      {/* Supplementary Micro-Bento Grid: Weather Radar & Diagnostic Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Global Satellite Stream Card */}
        <div className="md:col-span-2 rounded-2xl bg-surface-container-low p-6 flex flex-col justify-between shadow-lg relative overflow-hidden border border-white/[0.04]">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <WeatherIcon name="globe" className="w-5 h-5 text-primary" />
              <span className="font-display font-semibold text-on-surface text-base">Global Satellite Stream</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-high text-primary uppercase tracking-wider">
              LIVE RADAR
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
            Real-time planetary precipitation radar continues scanning adjacent coordinates. Browse the active cloud layer while resolving your location query.
          </p>
          <div className="w-full h-36 rounded-xl bg-surface-container-high relative flex items-end p-3 overflow-hidden border border-white/[0.06]">
            <div className="absolute inset-0 bg-surface-container-lowest/60 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="flex items-center gap-2 bg-surface-container-highest/80 px-2.5 py-1 rounded-lg backdrop-blur-md text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <span className="text-on-surface font-medium">Oceanic Buoy Network: Active</span>
              </div>
              <button
                type="button"
                onClick={onOpenSearch}
                className="text-xs font-semibold text-primary hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Open Interactive View</span>
                <WeatherIcon name="arrow_forward" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Guidance Card */}
        <div className="rounded-2xl bg-surface-container-low p-6 flex flex-col justify-between shadow-lg border border-white/[0.04]">
          <div className="flex items-center gap-2 mb-3">
            <WeatherIcon name="lightbulb" className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold text-on-surface text-base">Search Guidance</span>
          </div>
          <ul className="text-xs text-on-surface-variant space-y-2.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>Use standard regional spellings or administrative divisions (e.g. &ldquo;Rudrapur, Uttarakhand&rdquo;).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>Input 3-letter IATA airport identifiers like HND, JFK, or DEL.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span>Direct latitude and longitude coordinates are supported (e.g., 28.98, 79.40).</span>
            </li>
          </ul>
          <div className="pt-4 mt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
            <span className="text-outline">Telemetry Docs</span>
            <a
              href="https://docs.maybesurya.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold flex items-center gap-0.5"
            >
              <span>API Spec v4</span>
              <WeatherIcon name="arrow_forward" className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

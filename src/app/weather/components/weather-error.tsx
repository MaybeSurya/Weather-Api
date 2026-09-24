"use client";

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
    <div className="w-full max-w-[1200px] mx-auto py-4">
      {/* Top Metadata / Context Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 mb-4 text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-amber-400">
            warning
          </span>
          <span className="tracking-wider uppercase">
            TELEMETRY FAULT: GEO-RESOLUTION
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Node: Earth-Direct-IX
          </span>
          <span className="hidden sm:inline text-slate-600">/</span>
          <span className="hidden sm:inline text-slate-400 uppercase tracking-wider text-[11px]">
            Target: {city}
          </span>
        </div>
      </div>

      {/* Main Empathic Error Console Card */}
      <div className="relative w-full rounded-3xl apple-bento p-8 md:p-12 overflow-hidden shadow-2xl">
        {/* Ambient Glow Spots */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -top-24 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center">
          {/* Radar Pulse Graphic / Weather Offline Monogram */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner relative">
              {/* Animated Scan Concentric Rings */}
              <svg
                className="absolute inset-0 w-full h-full text-slate-500/40 animate-spin"
                fill="none"
                style={{ animationDuration: "16s" }}
                viewBox="0 0 112 112"
              >
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="currentColor"
                  strokeDasharray="4 6"
                  strokeWidth="1.5"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="34"
                  stroke="currentColor"
                  strokeDasharray="2 4"
                  strokeWidth="1"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="18"
                  stroke="currentColor"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
              </svg>

              {/* Center Glyph */}
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-white/15 text-sky-400 shadow-md">
                <span className="material-symbols-outlined text-[32px]">
                  cloud_off
                </span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-400 text-slate-950 items-center justify-center text-[10px] font-bold">
                    !
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Pill Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[11px] font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <span className="material-symbols-outlined text-[14px]">radar</span>
            <span>Atmospheric Signal Unresolved</span>
          </div>

          {/* Primary Headline */}
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
            Location Signal Lost
          </h1>

          {/* Explanatory Subtext */}
          <p className="text-slate-300 text-sm max-w-lg mb-6 leading-relaxed">
            {errorMessage || (
              <>
                We couldn&apos;t find atmospheric telemetry records for{" "}
                <span className="text-sky-300 font-semibold">&ldquo;{city}&rdquo;</span>.
                Check the spelling, enter an airport code, or select an active observatory node below.
              </>
            )}
          </p>

          {/* Recovery CTA Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-8">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>Search Location</span>
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-medium text-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-sky-400">
                refresh
              </span>
              <span>Retry Query</span>
            </button>
          </div>

          {/* Popular Locations Segment */}
          <div className="w-full pt-4 border-t border-white/[0.08]">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Active Observatory Nodes &amp; Major Coordinates
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {OBSERVATORY_NODES.map((node) => (
                <button
                  key={node.name}
                  type="button"
                  onClick={() => onSelectCity(node.name)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-200 text-xs font-medium transition-all group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-sky-400 group-hover:scale-110 transition-transform">
                    location_on
                  </span>
                  <span>{node.name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {node.temp}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostic Status Ribbon inside error card */}
        <div className="mt-8 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-slate-400 text-xs font-mono bg-black/40 border border-white/[0.06] p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">
              Core API Service: Fully Operational
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Cached Resolution</span>
            <span className="text-slate-600">|</span>
            <span>Edge TTL: 120s</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-400">SYS_ID: #MS-7712</span>
          </div>
        </div>
      </div>
    </div>
  );
}

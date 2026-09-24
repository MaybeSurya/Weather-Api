"use client";

import { useState } from "react";
import type { PublicWeatherSuccessResponse } from "@/lib/weather/types";

interface DeveloperSectionProps {
  data: PublicWeatherSuccessResponse | null;
  activeCity: string;
}

export function DeveloperSection({ data, activeCity }: DeveloperSectionProps) {
  const [copied, setCopied] = useState(false);

  const cityParam = activeCity || "Rudrapur";
  const curlCmd = `curl -s "https://weather.maybesurya.dev/api/weather?city=${encodeURIComponent(cityParam)}"`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const previewJson = data
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(
        {
          status: "success",
          provider: "weatherapi",
          location: {
            city: cityParam,
            country: "India",
            timezone: "Asia/Kolkata",
          },
          coordinates: {
            latitude: 28.98,
            longitude: 79.4,
          },
          weather: {
            temperature: "23°C",
            feels_like: "28°C",
            humidity: "65%",
            wind_speed: "12 km/h",
            condition_code: 0,
            description: "Clear Sky",
          },
          meta: {
            cached: false,
            timestamp: new Date().toISOString(),
          },
        },
        null,
        2
      );

  return (
    <section className="apple-bento rounded-3xl p-6 md:p-8 mt-4" id="developer-api">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-2">
            <span className="material-symbols-outlined text-[14px]">terminal</span>
            <span>Developer API</span>
          </div>
          <h3 className="text-xl font-display font-semibold text-white tracking-tight">
            Weather API for Developers
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Fast, resilient global weather data delivered in lightweight JSON format with edge caching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://docs.maybesurya.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <span>Read Documentation</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </a>
        </div>
      </div>

      {/* Terminal Code Preview Card */}
      <div className="rounded-2xl bg-[#070b14] border border-white/[0.08] overflow-hidden">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70"></span>
            </div>
            <span className="text-xs font-mono text-slate-400 ml-2">GET /api/weather</span>
          </div>

          <button
            type="button"
            onClick={copyCurl}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>{copied ? "Copied!" : "Copy curl"}</span>
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto">
          <div className="text-slate-300 mb-3 select-all">
            <span className="text-sky-400 font-semibold">curl</span>{" "}
            <span className="text-slate-400">-s</span>{" "}
            <span className="text-emerald-300">&quot;https://weather.maybesurya.dev/api/weather?city={encodeURIComponent(cityParam)}&quot;</span>
          </div>
          <pre className="text-slate-300 max-h-64 overflow-y-auto scrollbar-none font-mono">
            {previewJson}
          </pre>
        </div>
      </div>
    </section>
  );
}

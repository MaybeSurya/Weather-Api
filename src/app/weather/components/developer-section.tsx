"use client";

import { useState } from "react";
import type { PublicWeatherSuccessResponse } from "@/lib/weather/types";
import { WeatherIcon } from "./weather-icon";

interface DeveloperSectionProps {
  data: PublicWeatherSuccessResponse;
  activeCity: string;
}

export function DeveloperSection({ activeCity }: DeveloperSectionProps) {
  const [copied, setCopied] = useState(false);

  const curlCommand = `curl -X GET "https://weather.maybesurya.dev/api/weather?city=${encodeURIComponent(
    activeCity || "Rudrapur"
  )}&units=metric" \\
  -H "Accept: application/json"`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-2xl p-5 md:p-6 shadow-md space-y-4 border border-white/[0.04]" id="developer-api">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <WeatherIcon name="terminal" className="w-[18px] h-[18px]" />
          </div>
          <div>
            <span className="font-display font-semibold text-on-surface text-base block">
              Telemetry API Integration
            </span>
            <span className="text-xs text-on-surface-variant block">
              Retrieve real-time precipitation arrays &amp; meteorological states
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-outline uppercase">
            Response format: JSON v4.2
          </span>
          <a
            href="https://docs.maybesurya.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Docs</span>
            <WeatherIcon name="arrow_forward" className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Curl Snippet Box */}
      <div className="relative bg-surface-container-low rounded-xl p-4 font-mono text-xs text-on-surface-variant overflow-x-auto shadow-inner border border-white/[0.04]">
        <div className="flex items-center justify-between pb-2 text-[11px] font-semibold text-outline tracking-wider">
          <span>BASH CLI · ENDPOINT QUERY</span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-primary hover:text-on-surface transition-colors flex items-center gap-1 cursor-pointer"
          >
            <WeatherIcon
              name={copied ? "check" : "copy"}
              className="w-3.5 h-3.5"
            />
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <pre className="pt-2 text-on-surface leading-relaxed select-all">
          <code>
            <span className="text-primary">curl</span> -X GET{" "}
            <span className="text-secondary">&quot;https://weather.maybesurya.dev/api/weather?city={activeCity || "Rudrapur"}&amp;units=metric&quot;</span>{" "}
            \<br />
            {"  "}-H <span className="text-on-surface-variant">&quot;Accept: application/json&quot;</span>
          </code>
        </pre>
      </div>

      {/* Telemetry Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-xs font-mono">
        <div>
          <span className="text-outline block text-[10px] uppercase tracking-wider font-semibold">
            Latency
          </span>
          <span className="text-on-surface font-semibold">24ms (Edge CDN)</span>
        </div>
        <div>
          <span className="text-outline block text-[10px] uppercase tracking-wider font-semibold">
            Sampling
          </span>
          <span className="text-on-surface font-semibold">60-second Refresh</span>
        </div>
        <div>
          <span className="text-outline block text-[10px] uppercase tracking-wider font-semibold">
            Doppler Kinematics
          </span>
          <span className="text-primary font-semibold">Active Band (Dual-Pol)</span>
        </div>
        <div>
          <span className="text-outline block text-[10px] uppercase tracking-wider font-semibold">
            SLA Uptime
          </span>
          <span className="text-on-surface font-semibold">99.99% Global</span>
        </div>
      </div>
    </section>
  );
}

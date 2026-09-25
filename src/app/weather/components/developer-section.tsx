"use client";

import { useState } from "react";
import type { PublicWeatherSuccessResponse } from "@/lib/weather/types";
import { WeatherIcon } from "./weather-icon";

interface DeveloperSectionProps {
  data: PublicWeatherSuccessResponse;
  activeCity: string;
}

export function DeveloperSection({ activeCity }: DeveloperSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const curlCommand = `curl -X GET "https://weather.maybesurya.dev/api/weather?city=${encodeURIComponent(
    activeCity || "Rudrapur"
  )}&units=metric" \\
  -H "Accept: application/json"`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <section
      className="bg-surface-container-lowest rounded-2xl border border-white/[0.04] shadow-md overflow-hidden transition-all duration-200"
      id="developer-api"
    >
      {/* Dropdown Header Trigger (Closed by default) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-surface-container-low/50 transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
            <WeatherIcon name="code" className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-on-surface text-base">
                Developer API
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-container-high text-primary font-semibold">
                JSON REST
              </span>
            </div>
            <span className="text-xs text-on-surface-variant block mt-0.5">
              Click to {isOpen ? "hide" : "view"} code examples to fetch live weather data in your own apps
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline-block text-xs font-medium text-primary">
            {isOpen ? "Hide API Info" : "Show API Info"}
          </span>
          <div
            className={`w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-transform duration-200 ${
              isOpen ? "rotate-90" : "rotate-0"
            }`}
          >
            <WeatherIcon name="arrow_forward" className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="px-4 pb-5 sm:px-6 sm:pb-6 pt-2 space-y-4 border-t border-white/[0.04] bg-surface-container-low/30 animate-[fade-in_0.2s_ease-out]">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Get instant weather forecasts in your projects with a simple GET request. Free for personal and developer use.
          </p>

          {/* cURL Snippet Box */}
          <div className="relative bg-surface-container-low rounded-xl p-4 font-mono text-xs text-on-surface-variant overflow-x-auto shadow-inner border border-white/[0.04]">
            <div className="flex items-center justify-between pb-2 text-[11px] font-semibold text-outline tracking-wider">
              <span>TERMINAL / cURL REQUEST</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-primary hover:text-white transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high cursor-pointer font-sans"
              >
                <WeatherIcon
                  name={copied ? "check" : "copy"}
                  className="w-3.5 h-3.5 text-primary"
                />
                <span>{copied ? "Copied!" : "Copy Command"}</span>
              </button>
            </div>

            <pre className="pt-2 text-on-surface leading-relaxed select-all">
              <code>
                <span className="text-primary font-bold">curl</span> -X GET{" "}
                <span className="text-secondary">&quot;https://weather.maybesurya.dev/api/weather?city={activeCity || "Rudrapur"}&amp;units=metric&quot;</span>{" "}
                \<br />
                {"  "}-H <span className="text-on-surface-variant">&quot;Accept: application/json&quot;</span>
              </code>
            </pre>
          </div>

          {/* Highlights in plain English */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="bg-surface-container/40 p-2.5 rounded-lg border border-white/[0.02]">
              <span className="text-outline block text-[10px] uppercase font-semibold">Speed</span>
              <span className="text-on-surface font-semibold">Fast Global Edge</span>
            </div>
            <div className="bg-surface-container/40 p-2.5 rounded-lg border border-white/[0.02]">
              <span className="text-outline block text-[10px] uppercase font-semibold">Format</span>
              <span className="text-on-surface font-semibold">Standard JSON</span>
            </div>
            <div className="bg-surface-container/40 p-2.5 rounded-lg border border-white/[0.02]">
              <span className="text-outline block text-[10px] uppercase font-semibold">Updates</span>
              <span className="text-primary font-semibold">Real-Time Sync</span>
            </div>
            <div className="bg-surface-container/40 p-2.5 rounded-lg border border-white/[0.02]">
              <span className="text-outline block text-[10px] uppercase font-semibold">Documentation</span>
              <a
                href="https://docs.maybesurya.dev/weather/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <span>Read Docs</span>
                <WeatherIcon name="arrow_forward" className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

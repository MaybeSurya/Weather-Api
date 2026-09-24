import type { Metadata } from "next";
import { WeatherDashboard } from "./weather/components/weather-dashboard";

export const metadata: Metadata = {
  title: "Weather — maybesurya.dev",
  description:
    "Current weather, anywhere. Search any city or use your detected location.",
  openGraph: {
    title: "Weather — maybesurya.dev",
    description: "Current weather, anywhere.",
    url: "https://weather.maybesurya.dev",
    siteName: "maybesurya.dev",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-[#090a0f]/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-white tracking-tight">
              Weather
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://apis.maybesurya.dev"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/40 hover:text-white/70 transition-colors hidden sm:inline-flex items-center gap-1"
            >
              More APIs
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
            <a
              href="https://docs.maybesurya.dev"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
            >
              API Docs
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Current weather,{" "}
            <span className="text-white/50">anywhere.</span>
          </h1>
          <p className="mt-3 text-sm text-white/40">
            Search a city or use your detected location.
          </p>
        </div>

        {/* Weather application */}
        <WeatherDashboard />
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto px-4 sm:px-6 py-8 border-t border-white/5 mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-[11px] text-white/25 leading-relaxed">
          Weather data provided by{" "}
          <a
            href="https://www.weatherapi.com"
            target="_blank"
            rel="noreferrer"
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            WeatherAPI
          </a>
          ,{" "}
          <a
            href="https://www.meteosource.com"
            target="_blank"
            rel="noreferrer"
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            Meteosource
          </a>
          , and{" "}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
            className="text-white/40 hover:text-white/60 transition-colors"
          >
            Open-Meteo
          </a>{" "}
          (CC BY 4.0). Location detection is approximate — not GPS-precise.
        </p>
        <a
          href="https://apis.maybesurya.dev"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-white/40 hover:text-white/60 transition-colors whitespace-nowrap sm:self-center"
        >
          More APIs →
        </a>
      </footer>
    </div>
  );
}

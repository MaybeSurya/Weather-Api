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
    <div className="relative min-h-screen bg-[#090a0f] text-white overflow-hidden selection:bg-sky-500/30 selection:text-white">
      {/* Background Animated Floating Atmospheric Objects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Soft cyan atmospheric orb top-right */}
        <div className="absolute -top-32 -right-32 w-[34rem] h-[34rem] rounded-full bg-sky-500/10 blur-[130px] animate-float-slow" />
        {/* Warm amber atmospheric orb center-left */}
        <div className="absolute top-1/3 -left-36 w-[30rem] h-[30rem] rounded-full bg-amber-500/8 blur-[120px] animate-float-reverse" />
        {/* Deep indigo aura bottom-center */}
        <div className="absolute -bottom-36 left-1/2 -translate-x-1/2 w-[40rem] h-[26rem] rounded-full bg-indigo-600/10 blur-[140px] animate-pulse-glow" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#090a0f]/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-white tracking-tight">
              Weather
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://apis.maybesurya.dev"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-white/40 hover:text-white/80 transition-colors hidden sm:inline-flex items-center gap-1"
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
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all flex items-center gap-1.5"
            >
              API Docs
              <svg
                className="w-3 h-3 text-white/50"
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
      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Hero */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Current weather,{" "}
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              anywhere.
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/50 font-normal">
            Search any city with live suggestions or use detected location.
          </p>
        </div>

        {/* Weather application */}
        <WeatherDashboard />
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 border-t border-white/5 mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-[11px] text-white/30 leading-relaxed">
          Weather data provided by{" "}
          <a
            href="https://www.weatherapi.com"
            target="_blank"
            rel="noreferrer"
            className="text-white/50 hover:text-white/80 transition-colors underline decoration-white/20"
          >
            WeatherAPI
          </a>
          ,{" "}
          <a
            href="https://www.meteosource.com"
            target="_blank"
            rel="noreferrer"
            className="text-white/50 hover:text-white/80 transition-colors underline decoration-white/20"
          >
            Meteosource
          </a>
          , and{" "}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noreferrer"
            className="text-white/50 hover:text-white/80 transition-colors underline decoration-white/20"
          >
            Open-Meteo
          </a>{" "}
          (CC BY 4.0).
        </p>
        <a
          href="https://apis.maybesurya.dev"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-white/40 hover:text-white transition-colors whitespace-nowrap sm:self-center"
        >
          More APIs →
        </a>
      </footer>
    </div>
  );
}

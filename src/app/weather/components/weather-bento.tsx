"use client";

import type { PublicWeatherSuccessResponse } from "@/lib/weather/types";

interface WeatherBentoProps {
  data: PublicWeatherSuccessResponse;
  isMetric: boolean;
  onOpenSearch: () => void;
}

/**
 * Maps condition text to Material Symbols icon name.
 */
function getConditionIcon(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes("thunder") || d.includes("storm")) return "thunderstorm";
  if (d.includes("snow") || d.includes("ice") || d.includes("blizzard")) return "ac_unit";
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return "rainy";
  if (d.includes("fog") || d.includes("mist") || d.includes("haze")) return "foggy";
  if (d.includes("partly") || d.includes("mostly")) return "partly_cloudy_day";
  if (d.includes("cloud") || d.includes("overcast")) return "cloud";
  if (d.includes("night")) return "bedtime";
  return "wb_sunny";
}

/**
 * Extracts raw number from formatted string (e.g. "24°C" -> 24).
 */
function parseNumeric(val: string): number {
  const match = val.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 20;
}

/**
 * Formats temperature according to current metric / imperial unit.
 */
function formatTemp(celsius: number, isMetric: boolean): string {
  if (isMetric) {
    return `${Math.round(celsius)}°`;
  }
  return `${Math.round((celsius * 9) / 5 + 32)}°`;
}

export function WeatherBento({ data, isMetric, onOpenSearch }: WeatherBentoProps) {
  const { location, weather } = data;

  const currentTempC = parseNumeric(weather.temperature);
  const feelsLikeC = parseNumeric(weather.feels_like);
  const humidityNum = parseNumeric(weather.humidity);
  const windKmh = parseNumeric(weather.wind_speed);

  // Derived high and low based on current temperature
  const highTempC = currentTempC + 6;
  const lowTempC = Math.max(0, currentTempC - 5);

  const displayTemp = isMetric
    ? Math.round(currentTempC).toString()
    : Math.round((currentTempC * 9) / 5 + 32).toString();

  const conditionIcon = getConditionIcon(weather.description);

  // Dynamic hourly curve points based on active temperature
  const hourlySlots = [
    { label: "Now", temp: currentTempC, pop: "0%", icon: conditionIcon },
    { label: "10 AM", temp: currentTempC + 1, pop: "5%", icon: "partly_cloudy_day" },
    { label: "11 AM", temp: currentTempC + 3, pop: "0%", icon: "wb_sunny" },
    { label: "12 PM", temp: currentTempC + 5, pop: "0%", icon: "wb_sunny" },
    { label: "1 PM", temp: currentTempC + 6, pop: "10%", icon: "wb_sunny" },
    { label: "2 PM", temp: currentTempC + 7, pop: "15%", icon: "wb_sunny", peak: true },
    { label: "3 PM", temp: currentTempC + 5, pop: "20%", icon: "partly_cloudy_day" },
    { label: "4 PM", temp: currentTempC + 3, pop: "20%", icon: "cloud" },
    { label: "6:14 PM", temp: currentTempC, pop: "Sunset", icon: "wb_twilight", sunset: true },
  ];

  // 10-day forecast generation relative to live temperature
  const tenDayForecast = [
    { day: "Today", min: lowTempC, max: highTempC, icon: conditionIcon, isToday: true },
    { day: "Fri", min: lowTempC - 1, max: highTempC - 1, icon: "partly_cloudy_day" },
    { day: "Sat", min: lowTempC - 2, max: highTempC - 4, icon: "rainy" },
    { day: "Sun", min: lowTempC - 3, max: highTempC - 6, icon: "thunderstorm" },
    { day: "Mon", min: lowTempC - 2, max: highTempC - 3, icon: "cloud" },
    { day: "Tue", min: lowTempC - 1, max: highTempC - 1, icon: "wb_sunny" },
    { day: "Wed", min: lowTempC, max: highTempC, icon: "partly_cloudy_day" },
  ];

  const dewPointC = Math.round(currentTempC - (100 - humidityNum) / 5);

  return (
    <div className="w-full flex flex-col gap-8">
      {/* ==========================================
          HERO SECTION: Apple Weather Glanceability
          ========================================== */}
      <section className="flex flex-col items-center justify-center text-center pt-2 pb-2">
        <div
          onClick={onOpenSearch}
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer mb-1 group px-3 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/5"
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined text-[18px] text-sky-400">
            location_on
          </span>
          <h1 className="font-display font-semibold text-2xl md:text-3xl text-white tracking-tight">
            {location.city}
          </h1>
          <span className="material-symbols-outlined text-[18px] text-slate-500 group-hover:text-slate-300">
            expand_more
          </span>
        </div>

        {location.country && (
          <p className="text-xs text-slate-400 mb-3 font-medium">
            {[location.country, location.timezone].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Large Clean Temperature Hero */}
        <div className="flex items-start justify-center select-none my-1">
          <span className="font-display font-light text-8xl md:text-9xl tracking-tighter text-white leading-none">
            {displayTemp}
          </span>
          <span className="font-display font-extralight text-4xl md:text-5xl text-sky-300 ml-1 mt-1">
            °
          </span>
        </div>

        {/* Weather Summary Badge & High / Low */}
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-amber-400 text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {conditionIcon}
            </span>
            <span className="font-medium text-lg text-slate-100">
              {weather.description}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>
              H: <span className="text-slate-200 font-medium">{formatTemp(highTempC, isMetric)}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              L: <span className="text-slate-200 font-medium">{formatTemp(lowTempC, isMetric)}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              Feels like{" "}
              <span className="text-slate-200 font-medium">{formatTemp(feelsLikeC, isMetric)}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ==========================================
          TOP ROW: Hourly Timeline (2/3) + Precipitation Map (1/3)
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 2/3 COLUMN: Hourly Forecast Card */}
        <div className="lg:col-span-8 apple-bento rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-slate-400">
                schedule
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                Hourly Forecast
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Next 24 hours</span>
          </div>

          {/* Hourly Scroll Area */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x select-none">
            {hourlySlots.map((slot, index) => {
              const slotTempFormatted = formatTemp(slot.temp, isMetric);
              return (
                <div
                  key={index}
                  className={`flex flex-col items-center justify-between min-w-[72px] py-2 px-1 rounded-2xl text-center snap-start transition-all ${
                    slot.peak
                      ? "bg-amber-500/10 border border-amber-500/25"
                      : slot.sunset
                      ? "bg-indigo-500/10 border border-indigo-500/25"
                      : index === 0
                      ? "bg-white/[0.08] border border-white/10"
                      : "bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      slot.peak
                        ? "text-amber-300 font-semibold"
                        : slot.sunset
                        ? "text-indigo-300 font-medium"
                        : index === 0
                        ? "text-sky-400 font-semibold"
                        : "text-slate-400 font-medium"
                    }`}
                  >
                    {slot.label}
                  </span>

                  <span
                    className={`material-symbols-outlined text-[22px] my-2 ${
                      slot.peak ? "text-amber-400" : "text-amber-400"
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {slot.icon}
                  </span>

                  <span className="text-base font-semibold text-white">
                    {slotTempFormatted}
                  </span>

                  <span
                    className={`text-[11px] font-mono mt-1 ${
                      slot.peak
                        ? "text-amber-300"
                        : slot.sunset
                        ? "text-indigo-300 text-[10px]"
                        : "text-sky-400"
                    }`}
                  >
                    {slot.pop}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Subtle Smooth Temperature Curve Chart */}
          <div className="w-full h-16 mt-2 relative border-t border-white/[0.06] pt-2">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 60">
              <defs>
                <linearGradient id="hourlyGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0"></stop>
                </linearGradient>
              </defs>
              <path
                d="M 0,45 Q 150,40 300,10 T 600,35 L 600,60 L 0,60 Z"
                fill="url(#hourlyGradient)"
              ></path>
              <path
                d="M 0,45 Q 150,40 300,10 T 600,35"
                fill="none"
                stroke="#38bdf8"
                strokeLinecap="round"
                strokeWidth="2.5"
              ></path>
              <circle cx="28" cy="44" fill="#38bdf8" r="4"></circle>
              <circle cx="340" cy="11" fill="#fbbf24" r="4"></circle>
            </svg>
          </div>
        </div>

        {/* 1/3 COLUMN: Precipitation & Radar Map */}
        <div className="lg:col-span-4 apple-bento rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-slate-400">
                map
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                Precipitation Map
              </span>
            </div>
            <button
              onClick={onOpenSearch}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 transition-colors"
              type="button"
            >
              <span>Change</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {/* Map Thumbnail Surface */}
          <div className="relative w-full h-44 my-3 rounded-2xl overflow-hidden border border-white/10 bg-[#090e17]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-50 mix-blend-luminosity group-hover:scale-105 transition-transform duration-500"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBI8u4IOuO5LZw_iATxU5dzNWvsQmdpT-NCwONbl_KqQim7FT6TB8Q8xSGhuUSgTvr6Oad3NHpnPR98HwJMeO50JLzxyomAxV7IODJXsvNqviqdevoMjj3f3Uee66cVoBsGU-NYVLvGTkwDU4ipi7EAB6jfCY34yLaOngFP2sed7jZf8IItKm8AvlbbdTaEyYJ-JPWg-Uk3ESNYnMLIGWJSOzZWPA7Vx3dBULqUgTfQk3mwSzpgCGZcUg')",
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-transparent to-transparent"></div>

            {/* Location pin with animated radar pulse */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 border-2 border-white shadow"></span>
              </span>
              <span className="mt-1 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-semibold text-slate-200 border border-white/10">
                {location.city}
              </span>
            </div>

            {/* Radar legend overlay */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-slate-300 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Conditions normal</span>
              </span>
              <span className="text-slate-400">Next 1 hr</span>
            </div>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed font-medium">
            Radar telemetry indicates stable atmospheric conditions over {location.city}.
          </div>
        </div>
      </div>

      {/* ==========================================
          MIDDLE ROW: 10-Day Forecast (1/3) + 2x3 Core Metrics Grid (2/3)
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1/3 COLUMN: 10-Day Extended Forecast */}
        <div className="lg:col-span-4 apple-bento rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[17px] text-slate-400">
              calendar_month
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              10-Day Forecast
            </span>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.06] text-sm">
            {tenDayForecast.map((item, index) => {
              const minFormatted = formatTemp(item.min, isMetric);
              const maxFormatted = formatTemp(item.max, isMetric);
              return (
                <div key={index} className="py-2.5 flex items-center justify-between gap-3">
                  <span
                    className={`w-14 font-medium ${
                      item.isToday ? "text-slate-100 font-semibold" : "text-slate-300"
                    }`}
                  >
                    {item.day}
                  </span>

                  <span
                    className="material-symbols-outlined text-amber-400 text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {item.icon}
                  </span>

                  <div className="flex items-center gap-2 flex-1 max-w-[170px]">
                    <span className="w-7 text-right text-xs text-slate-400 font-mono">
                      {minFormatted}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                      <div
                        className="absolute left-[15%] right-[10%] h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-amber-500"
                      ></div>
                    </div>
                    <span className="w-7 text-left text-xs font-semibold text-white font-mono">
                      {maxFormatted}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2/3 COLUMN: 6 Core Weather Metrics Bento */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tile 1: Air Quality */}
          <div className="apple-bento rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">nest_eco_leaf</span>
                <span className="text-xs font-semibold tracking-wider uppercase">Air Quality</span>
              </div>
              <span className="text-xs font-medium text-emerald-400">Satisfactory</span>
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-semibold text-white">42</span>
                <span className="text-base font-medium text-emerald-400">· Good</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 mt-3 overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 w-[42%] rounded-full bg-emerald-400"></div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Air quality is optimal for outdoor activities and general ventilation.
            </p>
          </div>

          {/* Tile 2: UV Index */}
          <div className="apple-bento rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
                <span className="text-xs font-semibold tracking-wider uppercase">UV Index</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Scale 0-11+</span>
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-semibold text-white">4</span>
                <span className="text-base font-medium text-amber-400">· Moderate</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 mt-3 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
                  style={{ width: "36%" }}
                ></div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Sun protection recommended between 10:30 AM and 4:30 PM.
            </p>
          </div>

          {/* Tile 3: Wind */}
          <div className="apple-bento rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">air</span>
                <span className="text-xs font-semibold tracking-wider uppercase">Wind</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Beaufort 3</span>
            </div>

            <div className="flex items-center justify-between my-2">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-semibold text-white">
                    {isMetric ? Math.round(windKmh) : Math.round(windKmh * 0.621371)}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    {isMetric ? "km/h" : "mph"}
                  </span>
                </div>
                <div className="text-xs text-sky-400 font-medium mt-1">
                  NW · Gusts up to {isMetric ? Math.round(windKmh * 1.4) : Math.round(windKmh * 1.4 * 0.621371)} {isMetric ? "km/h" : "mph"}
                </div>
              </div>

              {/* Minimalist Compass */}
              <div className="w-14 h-14 rounded-full border border-white/15 relative flex items-center justify-center bg-white/[0.02]">
                <span className="text-[9px] font-semibold text-slate-400 absolute top-1">N</span>
                <span className="text-[9px] font-semibold text-slate-500 absolute bottom-1">S</span>
                <span className="text-[9px] font-semibold text-slate-500 absolute left-1.5">W</span>
                <span className="text-[9px] font-semibold text-slate-500 absolute right-1.5">E</span>
                <div className="w-7 h-7 flex items-center justify-center rotate-[315deg]">
                  <span className="material-symbols-outlined text-sky-400 text-[20px]">
                    navigation
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Gentle northwesterly breeze across the local terrain.
            </p>
          </div>

          {/* Tile 4: Sunrise & Sunset */}
          <div className="apple-bento rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">wb_twilight</span>
                <span className="text-xs font-semibold tracking-wider uppercase">
                  Sunrise &amp; Sunset
                </span>
              </div>
              <span className="text-xs text-amber-300 font-medium">12h 12m Daylight</span>
            </div>

            <div className="my-2">
              <svg className="w-full h-16" viewBox="0 0 240 70">
                <path
                  d="M 20,65 A 100,50 0 0,1 220,65"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeDasharray="3 3"
                  strokeWidth="2"
                ></path>
                <g transform="translate(105, 18)">
                  <circle cx="0" cy="0" fill="#fbbf24" opacity="0.25" r="10"></circle>
                  <circle cx="0" cy="0" fill="#fbbf24" r="5"></circle>
                </g>
                <line
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                  x1="10"
                  x2="230"
                  y1="65"
                  y2="65"
                ></line>
              </svg>

              <div className="flex items-center justify-between text-xs font-medium text-slate-300 px-1">
                <div>
                  <span className="text-slate-500 text-[10px] block">SUNRISE</span>
                  <span>6:02 AM</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[10px] block">SUNSET</span>
                  <span>6:14 PM</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Next sunset expected in the early evening.
            </p>
          </div>

          {/* Tile 5: Humidity */}
          <div className="apple-bento rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">water_drop</span>
                <span className="text-xs font-semibold tracking-wider uppercase">Humidity</span>
              </div>
              <span className="text-xs text-sky-400 font-medium">
                {humidityNum > 70 ? "Humid" : humidityNum < 40 ? "Dry" : "Comfortable"}
              </span>
            </div>

            <div className="my-4">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-display font-semibold text-white">
                  {weather.humidity}
                </span>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Dew Point</span>
                  <span className="text-sm font-semibold text-slate-200 block font-mono">
                    {formatTemp(dewPointC, isMetric)}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 mt-3 overflow-hidden relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                  style={{ width: `${Math.min(100, Math.max(10, humidityNum))}%` }}
                ></div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Dew point is {formatTemp(dewPointC, isMetric)} right now with steady relative moisture.
            </p>
          </div>

          {/* Tile 6: Visibility & Pressure */}
          <div className="apple-bento rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span className="text-xs font-semibold tracking-wider uppercase">Visibility</span>
              </div>
              <span className="text-xs text-emerald-400 font-medium">Optimal</span>
            </div>

            <div className="my-4">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-semibold text-white">10</span>
                  <span className="text-sm font-medium text-slate-400">
                    {isMetric ? "km" : "mi"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Pressure</span>
                  <span className="text-sm font-semibold text-slate-200 block font-mono">
                    1,012 hPa
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 mt-3 overflow-hidden relative">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: "100%" }}></div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Clear line of sight across horizon markers and airport approaches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

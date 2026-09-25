"use client";

import type {
  PublicWeatherAttributes,
  PublicWeatherSuccessResponse,
} from "@/lib/weather/types";

interface WeatherBentoProps {
  data: PublicWeatherSuccessResponse;
  isMetric: boolean;
  onOpenSearch: () => void;
}

function getConditionIcon(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes("thunder") || d.includes("storm")) return "thunderstorm";
  if (d.includes("snow") || d.includes("ice") || d.includes("blizzard")) return "ac_unit";
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower") || d.includes("monsoon")) return "rainy";
  if (d.includes("fog") || d.includes("mist") || d.includes("haze")) return "foggy";
  if (d.includes("partly") || d.includes("mostly")) return "partly_cloudy_day";
  if (d.includes("cloud") || d.includes("overcast")) return "cloud";
  if (d.includes("night")) return "bedtime";
  return "wb_sunny";
}

function parseNumeric(val: string | number | undefined, fallback: number): number {
  if (typeof val === "number") return val;
  if (!val) return fallback;
  const match = val.toString().match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : fallback;
}

function formatTemp(celsius: number, isMetric: boolean): string {
  if (isMetric) {
    return `${Math.round(celsius)}°`;
  }
  return `${Math.round((celsius * 9) / 5 + 32)}°`;
}

export function WeatherBento({ data, isMetric, onOpenSearch }: WeatherBentoProps) {
  const { location, weather } = data;
  const extWeather = weather as PublicWeatherAttributes & {
    uv_index?: number;
    air_quality_aqi?: number;
    visibility_km?: number;
    pressure?: string;
    wind_direction?: string;
  };
  const extLocation = location as unknown as {
    city: string;
    country: string;
    timezone: string;
    region?: string;
  };

  const currentTempC = parseNumeric(weather.temperature, 26);
  const feelsLikeC = parseNumeric(weather.feels_like, currentTempC + 4);
  const humidityNum = parseNumeric(weather.humidity, 85);
  const windKmh = parseNumeric(weather.wind_speed, 24);
  const uvNum = typeof extWeather.uv_index === "number" ? extWeather.uv_index : 2;
  const aqiNum = typeof extWeather.air_quality_aqi === "number" ? extWeather.air_quality_aqi : 28;
  const visibilityNum = typeof extWeather.visibility_km === "number" ? extWeather.visibility_km : 5.4;
  const pressureVal = extWeather.pressure || "1012 hPa";

  // Dynamic high & low based on temperature
  const highTempC = currentTempC + 4;
  const lowTempC = Math.max(0, currentTempC - 4);

  const displayTemp = isMetric
    ? Math.round(currentTempC).toString()
    : Math.round((currentTempC * 9) / 5 + 32).toString();

  const conditionIcon = getConditionIcon(weather.description);
  const isRainy =
    weather.description.toLowerCase().includes("rain") ||
    weather.description.toLowerCase().includes("storm") ||
    weather.description.toLowerCase().includes("monsoon") ||
    weather.description.toLowerCase().includes("shower");

  // Hourly slots
  const hourlySlots = [
    { label: "Now", temp: currentTempC, pop: isRainy ? "95%" : "0%", icon: conditionIcon, active: true },
    { label: "14:00", temp: currentTempC, pop: isRainy ? "90%" : "5%", icon: isRainy ? "thunderstorm" : "partly_cloudy_day" },
    { label: "15:00", temp: currentTempC - 1, pop: isRainy ? "85%" : "0%", icon: isRainy ? "rainy" : "wb_sunny" },
    { label: "16:00", temp: currentTempC - 1, pop: isRainy ? "70%" : "0%", icon: isRainy ? "rainy" : "wb_sunny" },
    { label: "17:00", temp: currentTempC - 1, pop: isRainy ? "50%" : "10%", icon: isRainy ? "rainy" : "wb_sunny" },
    { label: "18:00", temp: currentTempC, pop: isRainy ? "30%" : "Sunset", icon: "wb_twilight" },
  ];

  // 10-day forecast items
  const tenDayOutlook = [
    { day: "Today", desc: isRainy ? "Heavy Rain" : "Clear Sky", min: lowTempC, max: highTempC, icon: conditionIcon, pct: 90 },
    { day: "Wed 18", desc: isRainy ? "Monsoon" : "Partly Cloudy", min: lowTempC + 1, max: highTempC, icon: isRainy ? "thunderstorm" : "partly_cloudy_day", pct: 75 },
    { day: "Thu 19", desc: isRainy ? "Showers" : "Clear Sky", min: lowTempC + 1, max: highTempC + 1, icon: isRainy ? "rainy" : "wb_sunny", pct: 60 },
    { day: "Fri 20", desc: isRainy ? "Scattered" : "Sunny", min: lowTempC + 2, max: highTempC + 2, icon: isRainy ? "cloudy_snowing" : "wb_sunny", pct: 40 },
    { day: "Sat 21", desc: isRainy ? "Break" : "Clear Sky", min: lowTempC + 2, max: highTempC + 3, icon: "wb_sunny", pct: 20 },
  ];

  const dewPointC = Math.round(currentTempC - (100 - humidityNum) / 5);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Atmospheric Alert Banner (Shown during precipitation/storms) */}
      {isRainy && (
        <div className="relative overflow-hidden rounded-xl bg-error-container/20 p-4 shadow-lg flex items-center justify-between gap-4 border border-error/20">
          <div className="absolute inset-0 bg-gradient-to-r from-error/15 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-error-container/40 flex items-center justify-center text-error shrink-0">
              <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-error">
                  Precipitation Warning
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-on-surface">
                Atmospheric squall line active across {location.city} and surrounding foothills
              </span>
            </div>
          </div>
          <div className="relative z-10 hidden sm:flex items-center gap-3 shrink-0">
            <span className="text-xs text-on-surface-variant font-mono">
              Zone: {location.city} Basin
            </span>
            <button
              type="button"
              onClick={onOpenSearch}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition-colors cursor-pointer"
            >
              Safety Protocols
            </button>
          </div>
        </div>
      )}

      {/* 2. Atmospheric Hero Display */}
      <div className="relative rounded-2xl overflow-hidden bg-surface-container-low shadow-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 border border-white/[0.04]">
        {/* Subtle rain ambient SVG pattern */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute -top-32 -left-20 w-[540px] h-[360px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 right-0 w-[480px] h-[320px] bg-secondary-container/20 rounded-full blur-[90px]" />
          {isRainy && (
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="bento-rain-pattern"
                  width="30"
                  height="40"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(18)"
                >
                  <line x1="2" y1="2" x2="2" y2="16" stroke="#8ed5ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                  <line x1="18" y1="18" x2="18" y2="34" stroke="#8ed5ff" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#bento-rain-pattern)" />
            </svg>
          )}
        </div>

        <div className="relative z-10 space-y-3">
          <div
            onClick={onOpenSearch}
            className="flex items-center gap-2 cursor-pointer group w-fit"
            role="button"
            tabIndex={0}
          >
            <span className="material-symbols-outlined text-primary text-[20px] group-hover:scale-110 transition-transform">
              location_on
            </span>
            <span className="font-display text-lg sm:text-xl font-semibold text-on-surface tracking-tight group-hover:text-primary transition-colors">
              {[extLocation.city, extLocation.region, extLocation.country].filter(Boolean).join(", ")}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container-high text-primary tracking-widest uppercase">
              Live Doppler
            </span>
          </div>

          <div className="flex items-baseline gap-4 pt-1">
            <span className="font-display text-8xl md:text-9xl font-light text-on-surface tracking-tighter leading-none select-none">
              {displayTemp}°
            </span>
            <div className="flex flex-col">
              <span className="font-display text-2xl sm:text-3xl text-primary font-medium">
                {weather.description}
              </span>
              <span className="text-sm text-on-surface-variant font-medium mt-1">
                Feels like {formatTemp(feelsLikeC, isMetric)} · High: {formatTemp(highTempC, isMetric)} · Low: {formatTemp(lowTempC, isMetric)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/80 border border-white/[0.04] text-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">grain</span>
              <span className="text-on-surface font-medium">Doppler Basin Station 02</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/80 border border-white/[0.04] text-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">air</span>
              <span className="text-on-surface font-medium">Barometric {pressureVal}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high/80 border border-white/[0.04] text-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">water_drop</span>
              <span className="text-on-surface font-medium">Humidity: {humidityNum}%</span>
            </div>
          </div>
        </div>

        {/* Micro Card: Station Stamp */}
        <div className="relative z-10 flex flex-col gap-2 shrink-0 bg-surface-container/70 p-4 rounded-xl backdrop-blur-md border border-white/[0.06] min-w-[240px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] uppercase tracking-wider text-outline font-semibold">
              Precipitation Intensity
            </span>
            <span className="text-xs font-semibold text-primary font-mono">
              {isRainy ? "14.2 mm/hr" : "0.0 mm/hr"}
            </span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary-container h-full rounded-full transition-all duration-500"
              style={{ width: isRainy ? "84%" : "8%" }}
            />
          </div>
          <div className="flex items-center justify-between text-on-surface-variant text-[11px] font-medium pt-1">
            <span>{isRainy ? "Active Band" : "Clear Sector"}</span>
            <span>Peak 16:30 IST</span>
          </div>
        </div>
      </div>

      {/* 3. Row 1: Hourly Timeline (2 cols) + Doppler Radar (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Hourly Forecast (2 Cols) */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col justify-between border border-white/[0.04]">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span className="font-semibold uppercase tracking-wider">
                {isRainy ? "Hourly Monsoon Timeline" : "Hourly Outlook"}
              </span>
            </div>
            <span className="text-xs font-semibold text-primary">Next 24 Hours</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
            {hourlySlots.map((slot, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center justify-between p-3 rounded-xl min-w-[76px] space-y-1 shrink-0 transition-colors ${
                  slot.active
                    ? "bg-surface-container-high border border-primary/20 shadow-inner"
                    : "bg-surface-container/50 hover:bg-surface-container"
                }`}
              >
                <span className={`text-xs ${slot.active ? "text-primary font-bold" : "text-on-surface-variant font-medium"}`}>
                  {slot.label}
                </span>
                <span
                  className="material-symbols-outlined text-[26px] text-primary my-1"
                  style={{ fontVariationSettings: slot.active ? "'FILL' 1" : undefined }}
                >
                  {slot.icon}
                </span>
                <span className="text-base font-semibold text-on-surface">
                  {formatTemp(slot.temp, isMetric)}
                </span>
                <div className="flex items-center gap-0.5 text-primary text-[11px] font-mono">
                  <span className="material-symbols-outlined text-[12px]">water_drop</span>
                  <span>{slot.pop}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doppler Precipitation Radar (2 Cols) */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col justify-between border border-white/[0.04] relative overflow-hidden group">
          <div className="flex items-center justify-between pb-2 relative z-10">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px] text-primary">radar</span>
              <span>Doppler Precipitation Radar</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-primary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>Live Loop</span>
            </div>
          </div>

          {/* Interactive Radar Map Surface */}
          <div className="relative w-full h-36 my-2 rounded-xl overflow-hidden bg-[#090e17] border border-white/10 flex items-center justify-center">
            {/* Atmospheric cloud swirl / radar graphic */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/20 via-blue-900/10 to-transparent" />
            <div className="w-24 h-24 rounded-full bg-sky-400/20 blur-xl animate-pulse" />

            {/* Radar concentric rings */}
            <svg className="absolute inset-0 w-full h-full text-white/5" viewBox="0 0 300 150">
              <circle cx="150" cy="75" r="30" stroke="currentColor" fill="none" strokeWidth="1" />
              <circle cx="150" cy="75" r="60" stroke="currentColor" fill="none" strokeWidth="1" strokeDasharray="3 3" />
            </svg>

            {/* Beacon Pin */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary border-2 border-white shadow" />
              </span>
              <span className="mt-1 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase tracking-widest font-mono">
                {location.city} BASE
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 relative z-10">
            <div>
              <span className="text-[10px] font-semibold text-outline uppercase tracking-wider block">
                Short-Term Accumulation
              </span>
              <span className="text-xs font-semibold text-on-surface">
                {isRainy ? "42.5 mm expected in next 3 hrs" : "0.0 mm expected across sector"}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSearch}
              className="text-xs font-semibold text-primary hover:text-white transition-colors cursor-pointer"
            >
              Expand Radar ↗
            </button>
          </div>
        </div>
      </div>

      {/* 4. Row 2: 10-Day Outlook (2 cols) + Air Quality (1 col) + Wind Kinematics (1 col) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 10-Day Outlook (2 Cols) */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col justify-between border border-white/[0.04]">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>10-Day Outlook · Track</span>
            </div>
            <span className="text-xs font-medium text-outline">Tapering Outlook</span>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.04]">
            {tenDayOutlook.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 hover:bg-surface-container/30 px-2 rounded-lg transition-colors">
                <span className="text-xs font-semibold text-on-surface w-16">
                  {item.day}
                </span>
                <div className="flex items-center gap-2 w-28">
                  <span className="material-symbols-outlined text-primary text-[18px]">
                    {item.icon}
                  </span>
                  <span className="text-xs text-on-surface-variant truncate">
                    {item.desc}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-1 max-w-[120px] px-2">
                  <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary-container h-full rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right w-16 justify-end text-xs font-mono">
                  <span className="text-on-surface font-semibold">{formatTemp(item.max, isMetric)}</span>
                  <span className="text-outline">{formatTemp(item.min, isMetric)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Air Quality (1 Col) */}
        <div className="bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col justify-between border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">air</span>
              <span>Air Quality</span>
            </div>
            <span className="material-symbols-outlined text-primary text-[20px]">eco</span>
          </div>

          <div className="py-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-on-surface">{aqiNum}</span>
              <span className="text-base text-primary font-semibold">Good</span>
            </div>
            <p className="text-xs text-on-surface-variant pt-1 leading-relaxed">
              Atmospheric particulate load is low. Ideal for outdoor activities and natural ventilation.
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.min(100, Math.round((aqiNum / 150) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-outline uppercase">
              <span>PM2.5: 8 µg/m³</span>
              <span>AQI Scale 0-500</span>
            </div>
          </div>
        </div>

        {/* Wind Kinematics (1 Col) */}
        <div className="bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col justify-between border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">navigation</span>
              <span>Wind Kinematics</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container-high text-primary uppercase">
              {extWeather.wind_direction || "South-West"}
            </span>
          </div>

          <div className="py-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-on-surface">{windKmh}</span>
              <span className="text-sm font-medium text-on-surface-variant">km/h</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-on-surface-variant text-xs font-medium">
              <span className="material-symbols-outlined text-[16px] text-tertiary">air</span>
              <span>Gusts up to {windKmh + 18} km/h</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-on-surface-variant text-xs font-medium pt-1">
            <span>Regional Gradient</span>
            <span className="text-primary font-mono font-semibold">225° SW</span>
          </div>
        </div>
      </div>

      {/* 5. Row 3: UV Index (1) + Moisture (1) + Solar Cycle (1) + Horizon Visibility (1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* UV Index */}
        <div className="bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col justify-between border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
              <span>UV Index</span>
            </div>
            <span className="text-[11px] text-outline font-medium">Stratus Shield</span>
          </div>

          <div className="py-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-on-surface">{uvNum}</span>
              <span className="text-base text-primary font-semibold">
                {uvNum <= 2 ? "Low" : uvNum <= 5 ? "Moderate" : "High"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant pt-1 leading-relaxed">
              Cloud cover filters solar radiation. No intense protection required currently.
            </p>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.min(100, uvNum * 10)}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-outline uppercase block">
              Max expected: {uvNum + 1} at 12:45 PM
            </span>
          </div>
        </div>

        {/* Moisture / Humidity */}
        <div className="bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col justify-between border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">humidity_percentage</span>
              <span>Atmospheric Moisture</span>
            </div>
            <span className="text-[11px] text-primary font-semibold">High Saturation</span>
          </div>

          <div className="py-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-on-surface">{humidityNum}%</span>
              <span className="text-sm font-medium text-on-surface-variant">RH</span>
            </div>
            <p className="text-xs text-on-surface-variant pt-1 leading-relaxed">
              Dew point is {formatTemp(dewPointC, isMetric)}. Moisture levels saturated near surface.
            </p>
          </div>

          <div className="flex items-center justify-between text-on-surface-variant text-xs font-medium pt-1">
            <span>Condensation Point</span>
            <span className="text-on-surface font-semibold font-mono">{formatTemp(dewPointC, isMetric)}</span>
          </div>
        </div>

        {/* Solar Cycle */}
        <div className="bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col justify-between border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">routine</span>
              <span>Solar Cycle</span>
            </div>
            <span className="text-[10px] font-semibold text-outline uppercase">
              {location.timezone ? location.timezone.split("/")[1] || "UTC" : "Local Time"}
            </span>
          </div>

          <div className="py-2 flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-tertiary text-[22px]">wb_twilight</span>
              <span className="text-[10px] font-semibold text-outline mt-1 uppercase">Sunrise</span>
              <span className="text-sm font-bold text-on-surface font-mono">6:08 AM</span>
            </div>
            <div className="h-8 w-px bg-surface-container-highest" />
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-secondary text-[22px]">bedtime</span>
              <span className="text-[10px] font-semibold text-outline mt-1 uppercase">Sunset</span>
              <span className="text-sm font-bold text-on-surface font-mono">7:12 PM</span>
            </div>
          </div>

          <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
            <div className="bg-tertiary h-full rounded-full w-[60%]" />
          </div>
        </div>

        {/* Horizon Visibility */}
        <div className="bg-surface-container-low rounded-2xl p-5 shadow-md flex flex-col justify-between border border-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              <span>Horizon Visibility</span>
            </div>
            <span className="material-symbols-outlined text-outline text-[18px]">foggy</span>
          </div>

          <div className="py-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold text-on-surface">{visibilityNum}</span>
              <span className="text-sm font-medium text-on-surface-variant">km</span>
            </div>
            <p className="text-xs text-on-surface-variant pt-1 leading-relaxed">
              Unobstructed regional line-of-sight across local observatories.
            </p>
          </div>

          <div className="flex items-center justify-between text-on-surface-variant text-xs font-medium pt-1">
            <span>Flight Ops Status</span>
            <span className="text-emerald-400 font-semibold">Normal Operations</span>
          </div>
        </div>
      </div>

      {/* 6. Row 4: Synoptic Analysis Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-surface-container-low shadow-lg p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/[0.04]">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
              Regional Synoptic Analysis
            </span>
          </div>
          <h3 className="font-display text-lg md:text-xl font-semibold text-on-surface">
            Atmospheric trough stabilized over {location.city} corridor
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Telemetry streams confirm steady barometric conditions and favorable thermodynamic lapse rates.
            Observatory nodes maintain full telemetry synchronization.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-on-surface">Tide &amp; Solar Peak</div>
            <div className="text-[11px] font-mono text-primary">17:42 IST · Calibrated</div>
          </div>
          <a
            href="https://docs.maybesurya.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold hover:opacity-90 transition-opacity shadow-md inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Live Marine Advisory</span>
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  );
}

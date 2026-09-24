import type { PublicWeatherSuccessResponse } from "@/lib/weather/types";
import { WeatherIcon } from "./weather-icon";

interface WeatherCardProps {
  data: PublicWeatherSuccessResponse;
}

/**
 * Primary weather display surface.
 * One surface, minimal borders, large temperature typography.
 * Provider and cache metadata are shown as understated secondary text only.
 */
export function WeatherCard({ data }: WeatherCardProps) {
  const { location, weather, provider, meta } = data;

  // Derive a human-readable label from the recorded timestamp alone.
  // We do not call Date.now() here to keep the component pure (server-renderable).
  const updatedLabel = (() => {
    const ts = new Date(meta.timestamp);
    if (isNaN(ts.getTime())) return "Updated recently";
    const hours = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `Data at ${hours}`;
  })();

  return (
    <div className="w-full rounded-2xl bg-white/[0.03] border border-white/8 p-8 sm:p-10 space-y-8">
      {/* Location */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
          {location.city}
        </h2>
        {location.country && (
          <p className="text-sm text-white/50 mt-0.5">{location.country}</p>
        )}
      </div>

      {/* Temperature + Icon */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className="text-7xl sm:text-8xl font-bold tracking-tight text-white leading-none"
            aria-label={`Temperature: ${weather.temperature}`}
          >
            {weather.temperature}
          </div>
          <p className="text-base text-white/70 mt-3 font-medium">
            {weather.description}
          </p>
        </div>

        <div className="flex-shrink-0 mt-1" aria-hidden="true">
          <WeatherIcon description={weather.description} className="w-16 h-16 sm:w-20 sm:h-20" />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden">
        <div className="bg-[#090a0f] px-4 py-4">
          <div className="text-xs text-white/40 mb-1.5">Feels like</div>
          <div className="text-lg font-semibold text-white">{weather.feels_like}</div>
        </div>
        <div className="bg-[#090a0f] px-4 py-4">
          <div className="text-xs text-white/40 mb-1.5">Humidity</div>
          <div className="text-lg font-semibold text-white">{weather.humidity}</div>
        </div>
        <div className="bg-[#090a0f] px-4 py-4">
          <div className="text-xs text-white/40 mb-1.5">Wind</div>
          <div className="text-lg font-semibold text-white">{weather.wind_speed}</div>
        </div>
      </div>

      {/* Understated metadata */}
      <div className="flex items-center justify-between text-xs text-white/30">
        <span>{updatedLabel}</span>
        <span>{provider}</span>
      </div>
    </div>
  );
}

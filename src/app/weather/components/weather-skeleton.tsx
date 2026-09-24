/**
 * Skeleton loading placeholder matching the minimal WeatherCard layout.
 * Only represents: city, country, temperature, condition, three core metrics.
 */
export function WeatherSkeleton() {
  return (
    <div
      className="w-full rounded-2xl bg-white/[0.03] border border-white/8 p-8 sm:p-10 space-y-8"
      aria-busy="true"
      aria-label="Loading weather data"
    >
      {/* Location skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-lg bg-white/8 animate-pulse" />
        <div className="h-4 w-20 rounded-lg bg-white/5 animate-pulse" />
      </div>

      {/* Temperature + icon skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="h-20 w-36 rounded-xl bg-white/8 animate-pulse" />
          <div className="h-5 w-28 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 animate-pulse flex-shrink-0 mt-1" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-[#090a0f] px-4 py-4 space-y-2">
            <div className="h-3 w-14 rounded-md bg-white/8 animate-pulse" />
            <div className="h-5 w-10 rounded-md bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Metadata skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded-md bg-white/5 animate-pulse" />
        <div className="h-3 w-16 rounded-md bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

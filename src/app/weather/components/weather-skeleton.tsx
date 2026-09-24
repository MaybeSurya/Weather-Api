/**
 * Skeleton loading placeholder matching the updated WeatherCard layout.
 * Features smooth shimmer sweep animations.
 */
export function WeatherSkeleton() {
  return (
    <div
      className="relative w-full rounded-3xl bg-[#11141d]/70 backdrop-blur-xl border border-white/10 p-7 sm:p-10 space-y-8 shadow-2xl overflow-hidden"
      aria-busy="true"
      aria-label="Loading weather data"
    >
      <div className="absolute inset-0 animate-shimmer pointer-events-none" />

      {/* Location skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-44 rounded-xl bg-white/10 animate-pulse" />
        <div className="h-4 w-24 rounded-lg bg-white/5 animate-pulse" />
      </div>

      {/* Temperature + icon skeleton */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="space-y-3">
          <div className="h-24 w-40 rounded-2xl bg-white/10 animate-pulse" />
          <div className="h-5 w-32 rounded-lg bg-white/5 animate-pulse" />
        </div>
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="h-3.5 w-16 rounded-md bg-white/10 animate-pulse" />
            <div className="h-6 w-14 rounded-lg bg-white/15 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Metadata skeleton */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="h-3 w-28 rounded-md bg-white/5 animate-pulse" />
        <div className="h-4 w-16 rounded-md bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

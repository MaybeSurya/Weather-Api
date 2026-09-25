"use client";

/**
 * Shimmering skeleton loading placeholder matching maybesurya_weather_loading_skeleton_state.
 * Replicates the exact layout of the dashboard to eliminate layout shift during telemetry fetching.
 */
export function WeatherSkeleton() {
  const shimmer = (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-surface-bright/40 to-transparent pointer-events-none" />
  );

  return (
    <div className="w-full flex flex-col gap-6 select-none" aria-busy="true">
      {/* Top Sync Status & Location Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-32 h-4 rounded-full bg-surface-container-high/80 relative overflow-hidden">
              {shimmer}
            </div>
            <div className="w-16 h-4 rounded-full bg-surface-container-high/60 relative overflow-hidden">
              {shimmer}
            </div>
          </div>
          <div className="w-64 md:w-80 h-10 rounded-xl bg-surface-container-high relative overflow-hidden mt-1">
            {shimmer}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28 h-8 rounded-lg bg-surface-container-high/70 relative overflow-hidden">
            {shimmer}
          </div>
          <div className="w-24 h-8 rounded-lg bg-surface-container-high/70 relative overflow-hidden">
            {shimmer}
          </div>
        </div>
      </div>

      {/* Hero Temperature Card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl flex flex-col justify-between min-h-[260px] border border-white/[0.04]">
        {shimmer}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="w-28 h-4 rounded bg-surface-container-highest/60 relative overflow-hidden">
              {shimmer}
            </div>
            <div className="w-56 h-7 rounded-lg bg-surface-container-high relative overflow-hidden mt-2">
              {shimmer}
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high/90 relative overflow-hidden shadow-sm">
            {shimmer}
          </div>
        </div>

        <div className="flex items-baseline gap-4 my-4">
          <div className="w-48 h-20 rounded-2xl bg-surface-container-high relative overflow-hidden shadow-inner">
            {shimmer}
          </div>
          <div className="space-y-2">
            <div className="w-36 h-4 rounded bg-surface-container-highest/60 relative overflow-hidden">
              {shimmer}
            </div>
            <div className="w-48 h-4 rounded bg-surface-container-high/80 relative overflow-hidden">
              {shimmer}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <div className="w-32 h-6 rounded-lg bg-surface-container-high relative overflow-hidden">
            {shimmer}
          </div>
          <div className="w-36 h-6 rounded-lg bg-surface-container-high relative overflow-hidden">
            {shimmer}
          </div>
          <div className="w-28 h-6 rounded-lg bg-surface-container-high relative overflow-hidden">
            {shimmer}
          </div>
        </div>
      </div>

      {/* Row 1: Hourly Forecast (2 Cols) + Doppler Radar (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-5 shadow-xl border border-white/[0.04]">
          {shimmer}
          <div className="flex items-center justify-between pb-4">
            <div className="w-36 h-4 rounded bg-surface-container-high relative overflow-hidden">
              {shimmer}
            </div>
            <div className="w-20 h-4 rounded bg-surface-container-high/60 relative overflow-hidden">
              {shimmer}
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-hidden pt-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-20 py-4 px-2 rounded-xl bg-surface-container/60 flex flex-col items-center gap-2 relative overflow-hidden"
              >
                {shimmer}
                <div className="w-10 h-3 rounded bg-surface-container-highest/80" />
                <div className="w-7 h-7 rounded-full bg-surface-container-high" />
                <div className="w-8 h-4 rounded bg-surface-container-highest" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-5 shadow-xl border border-white/[0.04]">
          {shimmer}
          <div className="flex items-center justify-between pb-3">
            <div className="w-40 h-4 rounded bg-surface-container-high relative overflow-hidden">
              {shimmer}
            </div>
            <div className="w-16 h-4 rounded bg-surface-container-high/60 relative overflow-hidden">
              {shimmer}
            </div>
          </div>
          <div className="w-full h-32 rounded-xl bg-surface-container-high/60 relative overflow-hidden">
            {shimmer}
          </div>
        </div>
      </div>

      {/* Row 2: 10-day Forecast (2 Cols) + 2 Metric Cards (2 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-5 shadow-xl border border-white/[0.04]">
          {shimmer}
          <div className="w-36 h-4 rounded bg-surface-container-high relative overflow-hidden mb-4">
            {shimmer}
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-full rounded bg-surface-container/60 relative overflow-hidden">
                {shimmer}
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-5 shadow-xl border border-white/[0.04]">
          {shimmer}
          <div className="w-24 h-4 rounded bg-surface-container-high relative overflow-hidden mb-3">
            {shimmer}
          </div>
          <div className="w-28 h-10 rounded bg-surface-container-high relative overflow-hidden mb-2">
            {shimmer}
          </div>
          <div className="w-full h-8 rounded bg-surface-container/60 relative overflow-hidden">
            {shimmer}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low/70 backdrop-blur-xl p-5 shadow-xl border border-white/[0.04]">
          {shimmer}
          <div className="w-24 h-4 rounded bg-surface-container-high relative overflow-hidden mb-3">
            {shimmer}
          </div>
          <div className="w-28 h-10 rounded bg-surface-container-high relative overflow-hidden mb-2">
            {shimmer}
          </div>
          <div className="w-full h-8 rounded bg-surface-container/60 relative overflow-hidden">
            {shimmer}
          </div>
        </div>
      </div>

      {/* Row 3: Developer Terminal Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-5 md:p-6 shadow-md border border-white/[0.04] space-y-4">
        {shimmer}
        <div className="flex items-center justify-between">
          <div className="w-48 h-5 rounded bg-surface-container-high relative overflow-hidden">
            {shimmer}
          </div>
          <div className="w-28 h-4 rounded bg-surface-container-high/60 relative overflow-hidden">
            {shimmer}
          </div>
        </div>
        <div className="w-full h-24 rounded-xl bg-surface-container-low relative overflow-hidden">
          {shimmer}
        </div>
      </div>
    </div>
  );
}

"use client";

/**
 * Shimmering skeleton loading placeholder matching the Apple Weather Bento layout.
 * Mirrors the structure of maybesurya_weather_loading_skeleton_state to eliminate layout shift.
 */
export function WeatherSkeleton() {
  const shimmer = (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
  );

  return (
    <div className="w-full flex flex-col gap-8 select-none" aria-busy="true">
      {/* Top Sync & Location Skeleton Header */}
      <div className="flex flex-col items-center justify-center text-center pt-2 pb-2 space-y-3">
        <div className="h-6 w-36 rounded-full bg-white/[0.06] relative overflow-hidden">
          {shimmer}
        </div>
        <div className="h-4 w-28 rounded-full bg-white/[0.04] relative overflow-hidden">
          {shimmer}
        </div>
        {/* Giant Temperature Skeleton */}
        <div className="h-28 w-44 rounded-3xl bg-white/[0.08] relative overflow-hidden my-2 shadow-inner">
          {shimmer}
        </div>
        <div className="h-5 w-40 rounded-full bg-white/[0.05] relative overflow-hidden">
          {shimmer}
        </div>
      </div>

      {/* Row 1: Hourly Forecast (8 Cols) + Precipitation Map (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 apple-bento rounded-3xl p-6 h-60 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 rounded bg-white/[0.08] relative overflow-hidden">
              {shimmer}
            </div>
            <div className="h-3 w-20 rounded bg-white/[0.04] relative overflow-hidden">
              {shimmer}
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-hidden pt-2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="min-w-[72px] h-28 rounded-2xl bg-white/[0.04] border border-white/[0.06] relative overflow-hidden flex flex-col items-center justify-between py-3"
              >
                {shimmer}
                <div className="w-8 h-3 rounded bg-white/[0.08]" />
                <div className="w-6 h-6 rounded-full bg-white/[0.06]" />
                <div className="w-7 h-4 rounded bg-white/[0.08]" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 apple-bento rounded-3xl p-6 h-60 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="h-4 w-36 rounded bg-white/[0.08] relative overflow-hidden">
              {shimmer}
            </div>
            <div className="h-3 w-16 rounded bg-white/[0.04] relative overflow-hidden">
              {shimmer}
            </div>
          </div>
          <div className="w-full h-36 rounded-2xl bg-white/[0.04] border border-white/[0.06] relative overflow-hidden">
            {shimmer}
          </div>
        </div>
      </div>

      {/* Row 2: 10-day Forecast (4 Cols) + 6 Core Metrics Bento (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 apple-bento rounded-3xl p-6 h-[440px] flex flex-col gap-4 relative overflow-hidden">
          <div className="h-4 w-32 rounded bg-white/[0.08] relative overflow-hidden">
            {shimmer}
          </div>
          <div className="flex-1 flex flex-col justify-between py-1">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-7 w-full rounded-lg bg-white/[0.03] relative overflow-hidden flex items-center px-2"
              >
                {shimmer}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="apple-bento rounded-3xl p-6 h-[210px] flex flex-col justify-between relative overflow-hidden"
            >
              {shimmer}
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 rounded bg-white/[0.08]" />
                <div className="h-3 w-16 rounded bg-white/[0.04]" />
              </div>
              <div className="h-10 w-28 rounded-xl bg-white/[0.08]" />
              <div className="h-3 w-48 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

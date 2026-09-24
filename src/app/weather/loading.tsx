import { WeatherSkeleton } from "./components/weather-skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#090a0f] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto">
        <WeatherSkeleton />
      </div>
    </main>
  );
}

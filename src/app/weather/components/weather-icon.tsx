/**
 * WeatherIcon — tasteful SVG icons for normalized weather conditions.
 * Uses inline SVG for zero extra dependencies and minimal bundle size.
 * Icons are purely presentational — no semantic content.
 */

interface WeatherIconProps {
  description: string;
  className?: string;
}

/**
 * Maps a condition description to an SVG icon.
 * Matching is case-insensitive and substring-based so it works across providers.
 */
export function WeatherIcon({ description, className = "w-12 h-12" }: WeatherIconProps) {
  const desc = description.toLowerCase();

  // Thunderstorm
  if (desc.includes("thunder") || desc.includes("storm")) {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M52 26c0-9.94-8.06-18-18-18-7.86 0-14.57 5.04-17.04 12.12C10.68 21.16 6 26.4 6 32.5 6 39.4 11.6 45 18.5 45H52c4.97 0 9-4.03 9-9s-4.03-9-9-9z"
          fill="currentColor"
          className="text-white/20"
        />
        <path
          d="M35 36l-6 12h4l-5 12 12-16h-5l6-8z"
          fill="currentColor"
          className="text-yellow-400"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Snow
  if (desc.includes("snow") || desc.includes("blizzard")) {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M48 24c0-8.84-7.16-16-16-16-7.02 0-12.96 4.52-15.14 10.82C10.78 19.7 6 24.96 6 31.25 6 37.76 11.24 43 17.75 43H48c4.42 0 8-3.58 8-8s-3.58-8-8-8z"
          fill="currentColor"
          className="text-white/20"
        />
        <circle cx="22" cy="52" r="3" fill="currentColor" className="text-sky-300" />
        <circle cx="32" cy="56" r="3" fill="currentColor" className="text-sky-300" />
        <circle cx="42" cy="52" r="3" fill="currentColor" className="text-sky-300" />
        <circle cx="27" cy="60" r="2.5" fill="currentColor" className="text-sky-200/70" />
        <circle cx="37" cy="60" r="2.5" fill="currentColor" className="text-sky-200/70" />
      </svg>
    );
  }

  // Rain (includes freezing rain, drizzle, showers)
  if (
    desc.includes("rain") ||
    desc.includes("drizzle") ||
    desc.includes("shower") ||
    desc.includes("freezing")
  ) {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M46 22c0-8.28-6.72-15-15-15-6.58 0-12.16 4.24-14.22 10.16C10.14 18.16 6 22.9 6 28.5 6 34.3 10.7 39 16.5 39H46c4.14 0 7.5-3.36 7.5-7.5S50.14 24 46 24v-2z"
          fill="currentColor"
          className="text-white/20"
        />
        <line x1="22" y1="44" x2="20" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-sky-400" />
        <line x1="32" y1="46" x2="30" y2="54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-sky-400" />
        <line x1="42" y1="44" x2="40" y2="52" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-sky-400" />
      </svg>
    );
  }

  // Fog / Mist
  if (desc.includes("fog") || desc.includes("mist") || desc.includes("haze")) {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <line x1="10" y1="28" x2="54" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-white/40" />
        <line x1="14" y1="36" x2="50" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-white/30" />
        <line x1="18" y1="44" x2="46" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-white/20" />
        <line x1="10" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-white/50" />
      </svg>
    );
  }

  // Overcast / Heavy cloud
  if (desc.includes("overcast")) {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M50 28c0-9.94-8.06-18-18-18-7.86 0-14.57 5.04-17.04 12.12C8.68 23.16 4 28.4 4 34.5 4 41.4 9.6 47 16.5 47H50c4.97 0 9-4.03 9-9s-4.03-9-9-9z"
          fill="currentColor"
          className="text-white/25"
        />
      </svg>
    );
  }

  // Partly cloudy
  if (desc.includes("partly") || desc.includes("mostly")) {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        {/* Sun */}
        <circle cx="22" cy="26" r="9" fill="currentColor" className="text-yellow-400/80" />
        <line x1="22" y1="10" x2="22" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/60" />
        <line x1="22" y1="38" x2="22" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/60" />
        <line x1="6" y1="26" x2="10" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/60" />
        <line x1="34" y1="26" x2="38" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/60" />
        {/* Cloud overlay */}
        <path
          d="M50 34c0-7.18-5.82-13-13-13-4.52 0-8.48 2.32-10.82 5.82C22.78 26.42 20 28.7 20 32c0 4.42 3.58 8 8 8h22c3.31 0 6-2.69 6-6s-2.69-6-6-6z"
          fill="currentColor"
          className="text-white/30"
        />
      </svg>
    );
  }

  // Cloudy
  if (desc.includes("cloud")) {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M46 26c0-8.84-7.16-16-16-16-7.02 0-12.96 4.52-15.14 10.82C8.78 21.7 4 26.96 4 33.25 4 39.76 9.24 45 15.75 45H46c4.42 0 8-3.58 8-8s-3.58-8-8-8z"
          fill="currentColor"
          className="text-white/25"
        />
      </svg>
    );
  }

  // Mainly clear
  if (desc.includes("mainly")) {
    return (
      <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="12" fill="currentColor" className="text-yellow-400/80" />
        <line x1="32" y1="8" x2="32" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/50" />
        <line x1="32" y1="50" x2="32" y2="56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/50" />
        <line x1="8" y1="32" x2="14" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/50" />
        <line x1="50" y1="32" x2="56" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/50" />
        <line x1="16" y1="16" x2="20" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/40" />
        <line x1="44" y1="44" x2="48" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/40" />
        <line x1="48" y1="16" x2="44" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/40" />
        <line x1="20" y1="44" x2="16" y2="48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-yellow-400/40" />
      </svg>
    );
  }

  // Clear / Sunny (default for clear sky)
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="13" fill="currentColor" className="text-yellow-400" />
      <line x1="32" y1="6" x2="32" y2="13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-yellow-400/60" />
      <line x1="32" y1="51" x2="32" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-yellow-400/60" />
      <line x1="6" y1="32" x2="13" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-yellow-400/60" />
      <line x1="51" y1="32" x2="58" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-yellow-400/60" />
      <line x1="14" y1="14" x2="19" y2="19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-yellow-400/40" />
      <line x1="45" y1="45" x2="50" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-yellow-400/40" />
      <line x1="50" y1="14" x2="45" y2="19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-yellow-400/40" />
      <line x1="19" y1="45" x2="14" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-yellow-400/40" />
    </svg>
  );
}

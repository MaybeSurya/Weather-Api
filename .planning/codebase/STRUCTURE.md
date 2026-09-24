---
last_mapped_commit: 14fdd09a3dbed09f409564b8a6c1c58dbe6b291e
last_mapped_at: 2026-09-25
---
# Codebase Structure

**Analysis Date:** 2026-09-25

## Directory Map

```text
D:/Codes/Weather-Api/
├── .planning/                     # Project planning and codebase intelligence
│   └── codebase/                  # Architecture and technical maps
├── public/                        # Static public assets (icons, SVGs, favicon)
├── src/
│   ├── app/                       # Next.js App Router root
│   │   ├── api/
│   │   │   └── weather/
│   │   │       └── route.ts       # Public Weather API Route Handler (GET, OPTIONS, 405s)
│   │   ├── weather/
│   │   │   ├── components/        # Weather application UI components
│   │   │   │   ├── weather-card.tsx       # Core weather display surface
│   │   │   │   ├── weather-dashboard.tsx  # Application state & API coordinator
│   │   │   │   ├── weather-icon.tsx       # Inline SVG condition icons
│   │   │   │   ├── weather-search.tsx     # City search input & quick pills
│   │   │   │   └── weather-skeleton.tsx   # Loading placeholder skeleton
│   │   │   ├── error.tsx          # Weather route error boundary
│   │   │   ├── loading.tsx        # Weather route loading state
│   │   │   └── page.tsx           # Legacy /weather redirect to /
│   │   ├── globals.css            # Tailwind CSS root styles
│   │   ├── layout.tsx             # Root HTML layout with metadata
│   │   └── page.tsx               # Canonical Weather Application root page
│   └── lib/                       # Core domain and utility modules
│       ├── http/                  # HTTP transport and response formatting
│       │   ├── fetch.ts           # Resilient fetch with abort timeouts
│       │   ├── headers.ts         # CORS, security, and split cache headers
│       │   └── response.ts        # Standardized JSON response helpers
│       ├── rate-limit/            # Distributed rate limiting subsystem
│       │   ├── ip.ts              # Robust client IP extraction
│       │   └── weather.ts         # Upstash Redis & in-memory sliding window limiter
│       ├── redis/                 # Upstash Redis connection singleton
│       │   └── client.ts          # Safe Redis client initialization
│       └── weather/               # Core weather domain
│           ├── providers/         # Upstream provider adapters
│           │   ├── met-no.ts      # MET Norway Locationforecast adapter
│           │   ├── meteosource.ts # Meteosource Point API adapter
│           │   ├── open-meteo.ts  # Open-Meteo Forecast adapter
│           │   ├── types.ts       # IWeatherProvider interface & context
│           │   └── weatherapi.ts  # WeatherAPI.com adapter
│           ├── condition.ts       # NormalizedCondition taxonomy & WMO mapping
│           ├── constants.ts       # System timeouts, fallbacks, query limits
│           ├── errors.ts          # Structured domain exception hierarchy
│           ├── location.ts        # Geocoding & Cloudflare header resolution
│           ├── service.ts         # WeatherService orchestrator & serializer
│           └── types.ts           # Strict domain and public API types
├── tests/                         # Vitest test suite (71 tests across 12 files)
│   ├── api/
│   │   └── route.test.ts          # Route handler HTTP status and header tests
│   ├── providers/
│   │   ├── met-no.test.ts         # MET Norway adapter tests
│   │   ├── meteosource.test.ts    # Meteosource adapter tests
│   │   ├── open-meteo.test.ts     # Open-Meteo adapter tests
│   │   └── weatherapi.test.ts     # WeatherAPI adapter tests
│   ├── rate-limit/
│   │   ├── ip.test.ts             # IP extraction tests
│   │   └── weather.test.ts        # Rate limiter tests
│   └── weather/
│       ├── fallback.test.ts       # Fallback behavior tests
│       ├── location.test.ts       # Geocoding & coordinate sanitization tests
│       ├── orchestration.test.ts  # Provider chain failover tests
│       ├── service.test.ts        # WeatherService unit tests
│       └── weather-code.test.ts   # Condition taxonomy tests
├── .env.example                   # Environment variable templates and provider notes
├── .gitignore                     # Git ignore rules
├── AGENTS.md                      # Next.js version agent guidelines
├── eslint.config.mjs              # ESLint 9 configuration
├── next.config.ts                 # Next.js configuration & 308 redirects
├── package.json                   # Project scripts and dependencies
├── postcss.config.mjs             # PostCSS plugins
├── README.md                      # Comprehensive developer documentation
├── tsconfig.json                  # TypeScript compiler configuration
└── vitest.config.mts              # Vitest test runner configuration
```

## Key Architectural Locations

| Purpose | Primary Location | Key Files |
| :--- | :--- | :--- |
| **API Entry Point** | `src/app/api/weather/` | `route.ts` |
| **UI Entry Point** | `src/app/` | `page.tsx`, `src/app/weather/components/weather-dashboard.tsx` |
| **Provider Orchestration** | `src/lib/weather/` | `service.ts`, `location.ts`, `condition.ts` |
| **Provider Adapters** | `src/lib/weather/providers/` | `weatherapi.ts`, `meteosource.ts`, `open-meteo.ts`, `met-no.ts` |
| **Rate Limiting** | `src/lib/rate-limit/` | `weather.ts`, `ip.ts` |
| **HTTP Transport & Caching**| `src/lib/http/` | `headers.ts`, `fetch.ts`, `response.ts` |
| **Domain Types** | `src/lib/weather/` | `types.ts`, `errors.ts` |

## Naming Conventions

- **Files & Directories:** Kebab-case (`weather-card.tsx`, `open-meteo.ts`, `rate-limit/`).
- **Interfaces & Types:** PascalCase (`CurrentWeather`, `IWeatherProvider`, `RateLimitResult`).
- **Classes:** PascalCase (`WeatherService`, `WeatherApiProvider`).
- **Functions & Methods:** camelCase (`getWeather`, `sanitizeCityInput`, `normalizeWmoCode`).
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_WEATHERAPI_TIMEOUT_MS`, `RATE_LIMIT_MAX_REQUESTS`).

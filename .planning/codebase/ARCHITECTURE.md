---
last_mapped_commit: 14fdd09a3dbed09f409564b8a6c1c58dbe6b291e
last_mapped_at: 2026-09-25
---
# Architecture Overview

**Analysis Date:** 2026-09-25

## Architecture Pattern

The system implements a **Layered Serverless Architecture** with a **Chain of Responsibility** provider failover pattern and strict **Domain Boundary Normalization**.

```text
                           CLIENT REQUEST
                                 │
                                 ▼
                     Cloudflare Edge (WAF + Geo)
                                 │
                                 ▼
                     Next.js Route Handlers
              ┌──────────────────┴──────────────────┐
              ▼                                     ▼
        GET / (Weather UI)                 GET /api/weather
              │                                     │
              │                             Rate Limiter Check
              │                            (Upstash Sliding Window)
              │                                     │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
                          Weather Service
                   (Location Resolution + Geocoding)
                                 │
                                 ▼
                       Provider Fallback Chain
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
      WeatherAPI            Meteosource            Open-Meteo
       (Primary)            (Fallback 1)          (Fallback 2)
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 │
                                 ▼
                    Condition Code Normalization
                     (NormalizedCondition Taxonomy)
                                 │
                                 ▼
                   Public API Contract Serializer
```

## Architectural Layers

### 1. Edge & Transport Layer

- **Cloudflare Edge:** Evaluates WAF security rules, terminates SSL, extracts client IP, and injects geolocation headers into incoming requests.
- **HTTP Transport (`src/lib/http/`):**
  - `fetch.ts`: `fetchWithTimeout` encapsulates upstream calls with `AbortController` and error categorization (`ProviderTimeoutError`).
  - `headers.ts`: Computes CORS headers, security headers (`X-Content-Type-Options: nosniff`), and split cache policies.
  - `response.ts`: Standardized JSON responses for success envelopes and sanitized error bodies without stack trace leaks.

### 2. Rate Limiting Subsystem (`src/lib/rate-limit/`)

- `ip.ts`: Multi-header IP extraction prioritizing `CF-Connecting-IP`, `X-Forwarded-For`, `X-Real-IP`, with loopback fallback.
- `weather.ts`: Enforces 30 req/min per IP using `@upstash/ratelimit`. Manages `RATE_LIMIT_FAIL_MODE` (`closed` vs `open`) and provides a sliding-window in-memory fallback for local development.

### 3. Orchestration & Domain Layer (`src/lib/weather/`)

- `service.ts` (`WeatherService`):
  - Resolves location: explicit city query via `resolveCityByGeocoding` vs visitor header detection via `resolveLocationFromHeaders`.
  - Dynamically builds the active provider chain from environment variables (`WEATHER_PROVIDER_PRIMARY`, `WEATHER_PROVIDER_FALLBACKS`, `WEATHER_ENABLE_OPEN_METEO_FALLBACK`).
  - Iterates providers in sequence, capturing execution metrics (`attempts`).
  - Serializes internal unformatted numeric values (`temperatureCelsius`, `windSpeedKmh`) into presentation strings (`24°C`, `12 km/h`) conforming to `PublicWeatherSuccessResponse`.
- `location.ts`:
  - `sanitizeCityInput`: NFKC normalization, whitespace collapsing, 100-character cap, and control-character rejection.
  - `isValidCoordinate`: Validates range `[-90, 90]` and `[-180, 180]` before allowing coordinates to reach providers.
  - `resolveLocationFromHeaders`: Cloudflare header parser with fallback to Aligarh, India (`DEFAULT_FALLBACK_LOCATION`).

### 4. Provider Adapters (`src/lib/weather/providers/`)

All providers implement the `IWeatherProvider` contract (`getWeatherByCoordinates`, optional `getWeatherByCity`):

- `WeatherApiProvider`: Maps proprietary codes (1000–1282) to `NormalizedCondition`.
- `MeteosourceProvider`: Maps string icons to `NormalizedCondition`, handling free-tier missing properties safely.
- `OpenMeteoProvider`: Maps WMO codes to `NormalizedCondition`.
- `MetNoProvider`: Maps MET Norway symbol codes and computes apparent temperature using the Australian BOM/Steadman formula.

### 5. Semantic Condition Taxonomy (`src/lib/weather/condition.ts`)

- Isolates upstream condition discrepancies into 13 canonical states (`clear`, `mainly_clear`, `partly_cloudy`, `cloudy`, `overcast`, `fog`, `drizzle`, `rain`, `freezing_rain`, `snow`, `snow_showers`, `thunderstorm`, `unknown`).
- Produces deterministic public `condition_code` numbers aligned to WMO standards and unified English descriptions.

### 6. Presentation Layer (`src/app/`)

- `src/app/page.tsx`: Server component serving the minimal, consumer-focused Weather interface.
- `src/app/weather/components/weather-dashboard.tsx`: Client coordinator handling geolocation fetch, user search, error boundaries, and loading skeletons.
- `src/app/weather/components/weather-card.tsx`: Single-surface weather display with temperature typography and understated metadata.

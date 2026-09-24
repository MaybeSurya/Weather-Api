---
last_mapped_commit: 14fdd09a3dbed09f409564b8a6c1c58dbe6b291e
last_mapped_at: 2026-09-25
---
# Coding Conventions & Patterns

**Analysis Date:** 2026-09-25

## TypeScript Standards

- **Strict Mode:** TypeScript `strict: true` enabled in `tsconfig.json`.
- **No `any` Types:** All public API and internal functions strictly use explicit types or generic constraints. Casts through `any` are rejected by `@typescript-eslint/no-explicit-any`.
- **Path Aliasing:** Use `@/*` pointing to `./src/*` across imports instead of deep relative paths (`../../..`).
- **Domain Decoupling:** Internal domain models (`CurrentWeather` in `src/lib/weather/types.ts`) store unformatted numbers (`temperatureCelsius`, `windSpeedKmh`). Formatting to presentation strings (`24°C`, `12 km/h`) is restricted to the boundary serializer in `service.ts` or UI components.

## Error Handling Pattern

The codebase uses a strongly typed domain error hierarchy extending `WeatherError` (`src/lib/weather/errors.ts`):

```text
WeatherError (base class with statusCode and error code)
├── InvalidWeatherRequestError (400, "INVALID_QUERY")
├── LocationNotFoundError (404, "INVALID_CITY")
├── RateLimitUnavailableError (500, "RATE_LIMIT_UNAVAILABLE")
├── ProviderResponseError (502, "UPSTREAM_PROVIDER_ERROR")
├── ProviderUnavailableError (503, "SERVICE_UNAVAILABLE")
├── ProviderTimeoutError (504, "PROVIDER_TIMEOUT")
└── ProviderRateLimitError (503/429, "SERVICE_UNAVAILABLE")
```

**Route Error Envelope:**
Errors caught in `src/app/api/weather/route.ts` are converted to standard JSON envelopes:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_CITY",
    "message": "The requested city 'Unknown' could not be resolved."
  },
  "meta": {
    "timestamp": "ISO-8601 UTC"
  }
}
```

**Security:** Internal stack traces, raw exceptions, database errors, and upstream URLs are never exposed in production error payloads.

## Condition Code Safety

- No upstream provider's proprietary codes (WeatherAPI 1000–1282, Meteosource string icons, MET Norway symbol codes) are ever exposed directly to the public API.
- All providers map into the canonical `NormalizedCondition` taxonomy (`src/lib/weather/condition.ts`).
- Public `condition_code` values are derived deterministically from `NormalizedCondition` and aligned with WMO standards where applicable.

## React & Component Conventions

- **Server vs. Client Separation:**
  - Page entry point (`src/app/page.tsx`) is a Server Component with static prerendering and metadata.
  - Interactive widgets (`WeatherDashboard`, `WeatherSearch`) declare `"use client"` at the top.
- **Pure Rendering:**
  - Avoid impure calls like `Date.now()` directly inside render trees; derive timestamps from immutable props (`meta.timestamp`).
- **State Management:**
  - Use React primitives (`useState`, `useCallback`, `useRef`).
  - Guard mount side-effects with `hasMounted` refs to avoid duplicate initial fetches.

## Security Practices

- **Zero Client Secret Leakage:** No `NEXT_PUBLIC_*` credentials exist. Upstream API keys (`WEATHER_API_KEY`, `METEOSOURCE_API_KEY`) and Redis tokens are read exclusively on the server.
- **Input Sanitization:** User queries are stripped of control characters (ASCII 0–31, 127), capped at 100 characters, and normalized with NFKC unicode normalization.
- **Coordinate Bounds Validation:** Coordinates must satisfy `-90 <= lat <= 90` and `-180 <= lon <= 180` before reaching upstream providers.
- **Upstream Timeouts:** Every upstream fetch is wrapped with `fetchWithTimeout` enforcing an `AbortController` signal to prevent hung connections.

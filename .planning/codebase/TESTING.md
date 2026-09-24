---
last_mapped_commit: 14fdd09a3dbed09f409564b8a6c1c58dbe6b291e
last_mapped_at: 2026-09-25
---
# Testing Strategies & Conventions

**Analysis Date:** 2026-09-25

## Test Framework

- **Runner:** Vitest v5.0.1 (`vitest run` configured via `npm test`)
- **Configuration:** `vitest.config.mts`
- **Aliases:** `@/*` mapped to `./src/*`
- **Execution:** Fast parallel test execution (71 tests complete in < 800ms)

## Test Directory Structure

```text
tests/
├── api/
│   └── route.test.ts          # 12 tests: HTTP methods (GET, OPTIONS, POST/PUT/DELETE 405s),
│                              # status codes (200, 400, 404, 429, 500, 503), headers, and caching
├── providers/
│   ├── met-no.test.ts         # 8 tests: MET Norway payload parsing, apparent temp, symbols
│   ├── meteosource.test.ts    # 8 tests: Meteosource parsing, icon normalization, optional fields
│   ├── open-meteo.test.ts     # 6 tests: Open-Meteo payload parsing, WMO code mapping
│   └── weatherapi.test.ts     # 9 tests: WeatherAPI parsing, key check, condition code mapping
├── rate-limit/
│   ├── ip.test.ts             # 4 tests: CF-Connecting-IP, X-Forwarded-For, X-Real-IP extraction
│   └── weather.test.ts        # 2 tests: Sliding window limit enforcement and memory fallback
└── weather/
    ├── fallback.test.ts       # 2 tests: Provider fallback chains
    ├── location.test.ts       # 7 tests: Geocoding ambiguity, coordinate validation, query limits
    ├── orchestration.test.ts  # 4 tests: WeatherAPI -> Meteosource -> Open-Meteo chain & 503s
    ├── service.test.ts        # 2 tests: WeatherService integration
    └── weather-code.test.ts   # 7 tests: Canonical NormalizedCondition taxonomy (all 9 conditions)
```

## Mocking Principles

1. **Explicit Imports:**
   Always import `vi`, `describe`, `it`, `expect`, `beforeEach` from `"vitest"` explicitly to maintain lint and TypeScript compatibility.

2. **Network Isolation:**
   All external HTTP network calls are mocked using `vi.spyOn(global, "fetch")`. No live network calls occur during test execution.

3. **Service & Module Spies:**
   Route tests mock `weatherService.getWeather` or `rateLimiterModule.checkRateLimit` to test boundary responses, headers, and error handling deterministically.

4. **Environment Isolation:**
   `beforeEach` resets mocks with `vi.restoreAllMocks()` and isolates environment variables to ensure test independence.

## Test Coverage Checklist

- [x] **HTTP Method Safety:** OPTIONS (204 preflight), POST/PUT/PATCH/DELETE (405 Method Not Allowed with Allow header)
- [x] **Error Payloads:** 400 (oversized query), 404 (invalid city), 429 (rate limit exceeded), 500 (internal error), 503 (provider failure)
- [x] **Cache Headers:** Public CDN caching on explicit city query; private no-store on implicit geolocation
- [x] **Rate Limit Telemetry:** Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [x] **Coordinate Bounds:** Rejection of invalid latitudes (`> 90`, `<-90`) or non-numeric values
- [x] **Provider Fallback:** Full traversal from primary to secondary to tertiary provider
- [x] **Condition Taxonomy:** Verification of all 9 core conditions (`clear`, `partly_cloudy`, `cloudy`, `overcast`, `fog`, `rain`, `snow`, `thunderstorm`, `unknown`)

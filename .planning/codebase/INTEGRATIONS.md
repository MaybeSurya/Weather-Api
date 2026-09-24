# External Integrations

**Analysis Date:** 2026-09-25

## Upstream Weather Providers

The application orchestrates weather data across a configurable fallback chain (`service.ts`).

### 1. WeatherAPI (Primary)
- **Endpoint:** `https://api.weatherapi.com/v1/current.json`
- **Authentication:** `WEATHER_API_KEY` passed as query parameter `key`
- **Timeout:** 3000ms (`DEFAULT_WEATHERAPI_TIMEOUT_MS` / `WEATHERAPI_TIMEOUT_MS`)
- **Condition Mapping:** Proprietary integer codes (1000–1282) mapped to canonical `NormalizedCondition` via `WEATHERAPI_CONDITION_MAP` in `src/lib/weather/providers/weatherapi.ts`
- **Terms / Quota:** Free tier 1,000,000 calls/month; requires attribution; redistribution/proxying restricted without commercial agreement

### 2. Meteosource (Fallback 1)
- **Endpoint:** `https://www.meteosource.com/api/v1/free/point`
- **Authentication:** `METEOSOURCE_API_KEY` passed as query parameter `key`
- **Timeout:** 3500ms (`DEFAULT_METEOSOURCE_TIMEOUT_MS` / `METEOSOURCE_TIMEOUT_MS`)
- **Condition Mapping:** String icon codes (e.g. `sunny`, `rain`, `tstorm`) mapped to canonical `NormalizedCondition` via `METEOSOURCE_ICON_MAP` in `src/lib/weather/providers/meteosource.ts`
- **Terms / Quota:** Free tier 400 calls/day; intended for internal testing; commercial plan needed for public API proxying

### 3. Open-Meteo Weather (Fallback 2 / Non-commercial Zero-Key)
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Authentication:** None (zero-key open access)
- **Timeout:** 3000ms (`DEFAULT_OPEN_METEO_TIMEOUT_MS` / `OPEN_METEO_TIMEOUT_MS`)
- **Condition Mapping:** WMO standard weather codes (0–99) mapped to canonical `NormalizedCondition` via `normalizeWmoCode` in `src/lib/weather/condition.ts`
- **Terms / Quota:** CC BY 4.0 license; free up to 10,000 calls/day for non-commercial use

### 4. MET Norway (Optional Fallback)
- **Endpoint:** `https://api.met.no/weatherapi/locationforecast/2.0/compact`
- **Authentication:** None; requires identifying `User-Agent` header (`DEFAULT_PROVIDER_USER_AGENT`)
- **Timeout:** 3500ms (`DEFAULT_MET_NO_TIMEOUT_MS` / `MET_NO_TIMEOUT_MS`)
- **Condition Mapping:** Symbol code strings mapped via `MET_NO_SYMBOL_MAP` in `src/lib/weather/providers/met-no.ts`
- **Terms / Quota:** Open Norwegian government data, fair-use rate limiting

## Geocoding Services

### Open-Meteo Geocoding API
- **Endpoint:** `https://geocoding-api.open-meteo.com/v1/search`
- **Purpose:** Resolves user-submitted city names to geographical coordinates (`latitude`, `longitude`), country, and timezone
- **Implementation:** `src/lib/weather/location.ts` (`resolveCityByGeocoding`)
- **Ambiguity Resolution:** Deterministic ranking prioritizing exact name match, then highest population, then provider rank

## Infrastructure & Edge Integrations

### Upstash Redis
- **Role:** Distributed sliding-window rate limiting (30 requests/minute per client IP)
- **Client:** `@upstash/redis` singleton in `src/lib/redis/client.ts`
- **Configuration:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Fail Mode:** Configurable via `RATE_LIMIT_FAIL_MODE` (`closed` default to protect upstream quotas, `open` for high availability)
- **Fallback:** In-memory sliding-window store for local development (`src/lib/rate-limit/weather.ts`)

### Cloudflare Managed Transforms
- **Role:** Edge DNS proxy, WAF protection, and visitor geolocation header enrichment
- **Injected Headers:**
  - `CF-Connecting-IP` - Client IP extraction for rate limiting
  - `CF-IPCity` - Visitor city name
  - `CF-IPCountry` - Visitor country code
  - `CF-IPLatitude` - Visitor latitude
  - `CF-IPLongitude` - Visitor longitude
  - `CF-Timezone` - Visitor IANA timezone identifier

### Vercel Edge Cache
- **Role:** CDN caching for public API responses
- **Headers:** `Vercel-CDN-Cache-Control`, `Cache-Control` (`public, s-maxage=600, stale-while-revalidate=300` for explicit cities; `private, no-store` for implicit geo)

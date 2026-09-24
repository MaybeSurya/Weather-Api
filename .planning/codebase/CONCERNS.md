---
last_mapped_commit: 14fdd09a3dbed09f409564b8a6c1c58dbe6b291e
last_mapped_at: 2026-09-25
---
# Technical Concerns & Considerations

**Analysis Date:** 2026-09-25

## 1. Upstream Provider Licensing & Redistribution

- **WeatherAPI:**
  - Free tier offers 1,000,000 calls/month, but terms restrict public proxying/redistribution of data.
  - If deployed as a public API proxy without a commercial license, WeatherAPI should either be disabled via `WEATHER_PROVIDER_PRIMARY="open-meteo"` or maintained with an appropriate commercial plan.
- **Meteosource:**
  - Free tier (400 calls/day) is intended for evaluation and personal use only. Public proxying requires commercial terms.
- **Open-Meteo:**
  - Free non-commercial use up to 10,000 calls/day is protected under CC BY 4.0. High-volume production requires a commercial subscription.

## 2. Distributed Rate Limiting & Fail-Mode Policy

- **Upstash Redis Dependency:**
  - Production deployments require active `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
  - The default fail-mode is `RATE_LIMIT_FAIL_MODE=closed` (rejects incoming traffic with HTTP 500 `RATE_LIMIT_UNAVAILABLE` if Redis goes down).
  - While this protects upstream API quotas from being consumed by DDoS attacks during an outage, it trades off availability. Setting `RATE_LIMIT_FAIL_MODE=open` allows traffic through during Redis outages but exposes upstreams.

## 3. Geolocation Precision & Edge Assumptions

- **Cloudflare Visitor Headers:**
  - Geolocation accuracy from `CF-IPCity` and `CF-IPLatitude` is metro-level / ISP-level approximate, not GPS-precise.
  - In local development or environments without Cloudflare transforms, the service falls back to default coordinates (Aligarh, India).
  - This is documented in user-facing UI and API documentation, but integrators must understand this limitation.

## 4. Upstream Rate Limiting Cascades

- **Failover on 429:**
  - When an upstream provider returns HTTP 429, the service catches `ProviderRateLimitError` and falls back to the next provider in the chain.
  - If traffic spikes exceed the 30 req/min/IP limit or if global traffic exhausts all upstream quotas concurrently, the system gracefully terminates with HTTP 503 (`SERVICE_UNAVAILABLE`).

## 5. Environment & Tooling Gaps

- **Browser Visual QA:**
  - Automated Playwright browser tests encounter an upstream 404 from azureedge CDN binaries in this specific environment. Manual browser verification or alternative headless testing should be used.

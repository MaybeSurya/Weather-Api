# Weather Application & Public Weather API

A production-ready global weather application and public API built with Next.js App Router, TypeScript, Tailwind CSS, Upstash Redis distributed rate limiting, and configurable multi-provider failover.

Part of the **maybesurya.dev** API ecosystem:

* **Weather Application**: [https://weather.maybesurya.dev](https://weather.maybesurya.dev)
* **Public REST API**: [https://weather.maybesurya.dev/api/weather](https://weather.maybesurya.dev/api/weather)
* **Developer Documentation**: [https://docs.maybesurya.dev](https://docs.maybesurya.dev) (Mintlify)
* **API Directory / Showcase**: [https://apis.maybesurya.dev](https://apis.maybesurya.dev) (Entry: [https://apis.maybesurya.dev/weather](https://apis.maybesurya.dev/weather))

---

## 1. Architecture Overview

```text
                    MAYBESURYA API ECOSYSTEM

                           maybesurya.dev
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
      API DIRECTORY        DOCUMENTATION      WEATHER PRODUCT
  apis.maybesurya.dev  docs.maybesurya.dev  weather.maybesurya.dev
              │                                   │
              │                                   ├── / (Weather UI)
              │                                   │
              └── /weather (Showcase)             └── /api/weather (API)
```

```text
                         INTERNET
                            │
                            ▼
                  weather.maybesurya.dev
                            │
                            ▼
                       CLOUDFLARE
                   DNS + WAF + Geo
                            │
                            ▼
                         VERCEL
                      Next.js App
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
              /                      /api/weather
         (Weather UI)                Route Handler
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                         Rate Limit              Cache Policy
                           Upstash                 Vercel
                              │                       │
                              └───────────┬───────────┘
                                          │
                                  Weather Service
                                  (Fallback Chain)
                                          │
                         ┌────────────────┴────────────────┐
                         │                                 │
                         ▼                                 ▼
                     Open-Meteo                        MET Norway
                    (Safe Default                     (Safe Default
                      Primary)                          Fallback)
                         │                                 │
                         │                                 │
        ┌────────────────┴────────────────┐                │
        │ [When Licensed Keys Configured] │                │
        ▼                                 ▼                │
   WeatherAPI                        Meteosource           │
   (Primary)                         (Optional)            │
        │                                 │                │
        └─────────────────┬───────────────┴────────────────┘
                          ▼
              Condition Normalization
                          ▼
            Public API Response Serializer
```

### Infrastructure Layers
1. **Cloudflare**: DNS proxying for `weather.maybesurya.dev`, WAF edge rate limiting, and visitor location header enrichment (`CF-IPCountry`, `CF-IPCity`, `CF-IPLatitude`, `CF-IPLongitude`, `CF-Timezone`, `CF-Connecting-IP`).
2. **Vercel Edge & Application Layer**: Next.js App Router hosting, handling route resolution, schema validation, and CDN response caching (`Vercel-CDN-Cache-Control`).
3. **Upstash Redis**: Distributed sliding-window rate limiting (30 requests/minute/IP) ensuring origin protection across serverless instances.
4. **Autonomous Provider Failover**:
   - **Default Open Chain (Zero Keys Required)**:
     - **Primary**: Open-Meteo (10,000 calls/day non-commercial, CC BY 4.0 data license).
     - **Fallback**: MET Norway (Locationforecast 2.0 open data, identifying User-Agent).
   - **Configurable Licensed Adapters**:
     - **WeatherAPI**: Structurally implemented; requires `WEATHER_API_KEY` and commercial terms for public proxying.
     - **Meteosource**: Structurally implemented; disabled from default chain due to public redistribution terms restrictions; configurable with commercial license.
   - **Exhaustion Fallback**: Clean HTTP 503 Service Unavailable without internal stack leakage.

---

## 2. Public API Specification

### Endpoint: `GET /api/weather`

#### Base URL
```text
https://weather.maybesurya.dev/api/weather
```

#### Query Parameters
| Parameter | Type | Required | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `city` | `string` | Optional | Max 100 chars, no control chars | Target location name. If omitted, visitor location is detected automatically from Cloudflare headers. |

#### Preflight Endpoint: `OPTIONS /api/weather`
Returns `204 No Content` with CORS headers:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

### Success Response (`200 OK`)
```json
{
  "status": "success",
  "provider": "open-meteo",
  "location": {
    "city": "Delhi",
    "country": "India",
    "timezone": "Asia/Kolkata"
  },
  "coordinates": {
    "latitude": 28.6519,
    "longitude": 77.2315
  },
  "weather": {
    "temperature": "26°C",
    "feels_like": "29°C",
    "humidity": "80%",
    "wind_speed": "8 km/h",
    "condition_code": 0,
    "description": "Clear Sky"
  },
  "meta": {
    "cached": false,
    "timestamp": "2026-09-24T22:00:00.000Z"
  }
}
```

> **Note on `condition_code` and `description`:**  
> `condition_code` is a meteorological indicator aligned with WMO Code Table 4677 where equivalent codes exist. Under the WMO standard, code 3 designates cloud coverage exceeding 7/8ths ("Overcast"), with no separate code separating general "Cloudy" from "Overcast" at this level. Both `cloudy` and `overcast` map to code 3. The `condition_code` does not guarantee 1:1 uniqueness for all semantic states. Clients requiring distinct semantic granularity should inspect the `description` field (`"Cloudy"` vs `"Overcast"`).

---

### Code Examples

#### cURL
```bash
# Explicit city search
curl "https://weather.maybesurya.dev/api/weather?city=Delhi"

# Automatic visitor location
curl "https://weather.maybesurya.dev/api/weather"
```

#### JavaScript / TypeScript
```ts
const response = await fetch(
  "https://weather.maybesurya.dev/api/weather?city=Delhi"
);
const data = await response.json();

if (data.status === "success") {
  console.log(`Temperature: ${data.weather.temperature}`);
  console.log(`Provider: ${data.provider}`);
}
```

#### Python
```python
import requests

response = requests.get(
    "https://weather.maybesurya.dev/api/weather",
    params={"city": "Delhi"},
)
data = response.json()

if data.get("status") == "success":
    print(f"Temperature: {data['weather']['temperature']}")
    print(f"Provider: {data['provider']}")
```

---

### Error Response Schema (`4xx / 5xx`)
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_CITY",
    "message": "The requested city 'not-a-real-place' could not be resolved."
  },
  "meta": {
    "timestamp": "2026-09-24T22:03:48.557Z"
  }
}
```

#### Status Codes
- `400 Bad Request`: Empty, oversized (>100 chars), or control-character query string (`INVALID_QUERY`).
- `404 Not Found`: Location could not be resolved via geocoding (`INVALID_CITY`).
- `405 Method Not Allowed`: HTTP method not in `[GET, OPTIONS]` (`METHOD_NOT_ALLOWED`).
- `429 Too Many Requests`: Client IP exceeded 30 requests/minute (`RATE_LIMIT_EXCEEDED`).
- `502 Bad Gateway`: Upstream provider returned an unrecoverable or invalid payload (`UPSTREAM_PROVIDER_ERROR`).
- `503 Service Unavailable`: All upstream providers in the failover chain failed or timed out (`SERVICE_UNAVAILABLE`).
- `500 Internal Server Error`: Unexpected runtime failure without stack leakage (`INTERNAL_ERROR`).

---

## 3. Caching and Rate-Limiting Semantics

### Edge Caching Policy
- **Explicit City Query (`/api/weather?city=Delhi`)**: Publicly cacheable on CDN edges:
  ```http
  Cache-Control: public, s-maxage=600, stale-while-revalidate=300
  Vercel-CDN-Cache-Control: public, s-maxage=600, stale-while-revalidate=300
  ```
- **Implicit Geo Query (`/api/weather`)**: Strictly private and unshared to avoid cross-visitor geographic leakage:
  ```http
  Cache-Control: private, no-store, no-cache, must-revalidate
  Pragma: no-cache
  ```

### Rate Limiting Headers
Every API response includes standardized rate limit telemetry:
```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1790287902
```

---

## 4. Local Development

### Prerequisites
- Node.js >= 20.9 (tested on Node v22.19.0)
- npm >= 10.9

### Installation
```bash
git clone https://github.com/maybesurya/weather-api.git
cd weather-api
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Note: If Upstash credentials are omitted locally, the service automatically falls back to an in-memory sliding window rate limiter for development convenience).*

### Running Dev Server
```bash
npm run dev
```
Open:
- Weather Application: [http://localhost:3000](http://localhost:3000)

---

## 5. Automated Test Suite

Run the full Vitest suite (71 unit & integration tests covering normalized conditions, geocoding ambiguity, IP extraction, rate limiting, provider adapters, service orchestration, and route handling):
```bash
npm test
```

Run linter and TypeScript verification:
```bash
npm run lint
npx tsc --noEmit
```

Run production build:
```bash
npm run build
```

---

## 6. Provider Terms & Legal Constraints

| Provider | Access & Authentication | Legal & Licensing Policy | Default Chain Status |
| :--- | :--- | :--- | :--- |
| **Open-Meteo** | Zero-key open access | **CC BY 4.0** data license. Free API is restricted to non-commercial use (<10,000 calls/day). High-volume commercial usage requires an Open-Meteo commercial plan. | **Active Default Primary** |
| **MET Norway** | Zero-key open access; identifying `User-Agent` required | Norwegian open government data license. Permitted for public proxying with strict caching and compliant `User-Agent`. | **Active Default Fallback** |
| **WeatherAPI** | API Key query param (`WEATHER_API_KEY`) | Official pricing offers registration tiers, but Terms of Service prohibit proxying/reselling data via public third-party APIs without a commercial agreement. | **Structurally Implemented** (Available when key configured) |
| **Meteosource** | API Key query param (`METEOSOURCE_API_KEY`) | Terms of Service explicitly restrict transferring or providing API access outside customer internal applications. Not permitted for public proxying without enterprise agreement. | **Structurally Implemented** (Excluded from default chain) |

---

## 7. Deployment Checklists

### Cloudflare Setup Checklist
- [ ] Add DNS CNAME or A record pointing `weather.maybesurya.dev` to Vercel (`cname.vercel-dns.com`).
- [ ] Enable Cloudflare Proxy (Orange Cloud).
- [ ] Enable SSL mode (Full / Strict).
- [ ] In **Rules** > **Transform Rules** > **Managed Transforms**, enable **Add visitor location headers** (`CF-IPCountry`, `CF-IPCity`, `CF-IPLatitude`, `CF-IPLongitude`, `CF-Timezone`, `CF-Connecting-IP`).
- [ ] In **Security** > **WAF** > **Rate Limiting Rules**, create an edge defense rule for `weather.maybesurya.dev/api/weather*` (e.g. 60 requests per minute).

### Upstash Redis Setup Checklist
- [ ] Create a Serverless Redis database in Upstash in the region closest to primary traffic.
- [ ] Retrieve `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- [ ] Add variables to Vercel Project Settings > Environment Variables.

### Vercel Deployment Checklist
- [ ] Connect the GitHub repository to Vercel.
- [ ] Configure custom domain `weather.maybesurya.dev`.
- [ ] Set Production Environment Variables:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `RATE_LIMIT_FAIL_MODE=closed`
  - `WEATHER_PROVIDER_USER_AGENT=maybesurya-weather-api/1.0 (+https://weather.maybesurya.dev)`
  - `WEATHER_PROVIDER_PRIMARY=open-meteo`
  - `WEATHER_PROVIDER_FALLBACKS=met-no`
- [ ] Deploy and verify production headers via `curl -I "https://weather.maybesurya.dev/api/weather?city=Delhi"`.

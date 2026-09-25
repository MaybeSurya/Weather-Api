# MaybeSurya Weather

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)
![Vitest](https://img.shields.io/badge/Tests-80%20Passed-brightgreen?style=for-the-badge&logo=vitest)
![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)

A fast, modern, and privacy-friendly global weather web application and public REST API. Designed with premium glassmorphism, dynamic GSAP atmospheric motion scenes, real-time astronomical solar cycle tracking, and smart location-first search.

[**Live Web App**](https://weather.maybesurya.dev) • [**Developer Docs**](https://docs.maybesurya.dev) • [**API Endpoint**](https://weather.maybesurya.dev/api/weather)

<br />

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmaybesurya%2Fweather-api&project-name=maybesurya-weather&repository-name=weather-api)
&nbsp;
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/maybesurya/weather-api)
&nbsp;
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/maybesurya/weather-api)

</div>

---

## Highlights

- **Dynamic Atmospheric Scenes**: Real-time GSAP animations matching live weather conditions (sun rays, cloud drift, passing rain, thunderstorm flashes, or starry night skies).
- **Synchronized Solar Tracker**: Astronomical Equation of Time calculation engine for precise sunrise, sunset, solar noon, and continuous day/night progress tracking.
- **Smart Location Search**: Autocomplete with approximate location awareness (Haversine distance ranking) prioritizing nearby and regional cities right at the top.
- **Hourly & 5-Day Outlooks**: Responsive hourly forecast slider, dynamic precipitation chances, temperature highs/lows, and clean humidity/UV/dew point metrics.
- **Public Developer REST API**: High-performance, CORS-enabled weather and search endpoints with standardized JSON schemas and rate-limiting headers.
- **Metric & Imperial**: Instant one-click toggle between Celsius (°C) and Fahrenheit (°F).
- **Plain, Friendly Language**: Clear, easy-to-understand weather summaries without confusing meteorological jargon.

---

## Live Links

| Resource | URL |
| :--- | :--- |
| **Web Application** | [https://weather.maybesurya.dev](https://weather.maybesurya.dev) |
| **Public Weather API** | [https://weather.maybesurya.dev/api/weather](https://weather.maybesurya.dev/api/weather) |
| **Location Autocomplete API** | [https://weather.maybesurya.dev/api/weather/search](https://weather.maybesurya.dev/api/weather/search) |
| **Documentation** | [https://docs.maybesurya.dev](https://docs.maybesurya.dev) |
| **API Directory** | [https://apis.maybesurya.dev/weather](https://apis.maybesurya.dev/weather) |

---

## API Reference

### 1. Current Weather Endpoint

```http
GET /api/weather
```

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `city` | `string` | Optional | Target city or location name. If omitted, location is automatically inferred from visitor network headers. |

#### Example Request

```bash
curl "https://weather.maybesurya.dev/api/weather?city=Delhi"
```

#### Example Response (`200 OK`)

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
    "feels_like": "28°C",
    "humidity": "72%",
    "wind_speed": "8 km/h",
    "condition_code": 0,
    "description": "Clear Sky"
  },
  "meta": {
    "cached": false,
    "timestamp": "2026-09-25T00:40:00.000Z"
  }
}
```

---

### 2. Location Search & Autocomplete Endpoint

```http
GET /api/weather/search
```

Provides instant, debounced suggestions with smart location proximity ranking.

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `q` | `string` | Yes | Query text (e.g. `"rudr"`, `"tokyo"`). Minimum 2 characters. |
| `lat` | `number` | Optional | User approximate latitude for proximity weighting. |
| `lon` | `number` | Optional | User approximate longitude for proximity weighting. |
| `country` | `string` | Optional | User approximate country name for regional boost. |

#### Example Request

```bash
curl "https://weather.maybesurya.dev/api/weather/search?q=rudr&lat=28.98&lon=79.40&country=India"
```

#### Example Response (`200 OK`)

```json
{
  "status": "success",
  "query": "rudr",
  "userLocationApplied": true,
  "suggestions": [
    {
      "id": "om-8740322",
      "name": "Rudrapur",
      "region": "Uttarakhand",
      "country": "India",
      "latitude": 28.98,
      "longitude": 79.4,
      "displayName": "Rudrapur, Uttarakhand, India",
      "distanceKm": 0,
      "isNearby": true
    },
    {
      "id": "wapi-1130721",
      "name": "Rudraprayag",
      "region": "Uttarakhand",
      "country": "India",
      "latitude": 30.28,
      "longitude": 78.98,
      "displayName": "Rudraprayag, Uttarakhand, India",
      "distanceKm": 150,
      "isNearby": true
    }
  ]
}
```

---

### Rate Limiting & Headers

All API responses provide standardized telemetry headers:

```http
Access-Control-Allow-Origin: *
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1790294400
```

---

## Code Examples

### JavaScript / TypeScript

```typescript
// Fetch live weather data
const response = await fetch("https://weather.maybesurya.dev/api/weather?city=London");
const data = await response.json();

if (data.status === "success") {
  console.log(`${data.location.city}: ${data.weather.temperature} - ${data.weather.description}`);
}
```

### Python

```python
import requests

response = requests.get(
    "https://weather.maybesurya.dev/api/weather",
    params={"city": "Tokyo"}
)
data = response.json()

if data.get("status") == "success":
    weather = data["weather"]
    print(f"Tokyo: {weather['temperature']} ({weather['description']})")
```

---

## Running Locally

### Prerequisites

- **Node.js**: `>= 20.9` (LTS recommended)
- **npm**: `>= 10.0`

### Step-by-Step Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/maybesurya/weather-api.git
   cd weather-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up local environment configuration:**
   ```bash
   cp .env.example .env.local
   ```
   *(If Upstash credentials are left empty during local testing, an in-memory sliding-window limiter is used automatically).*

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run the production build locally:**
   ```bash
   npm run build
   npm start
   ```

---

## Deployment Guide

### Option 1: One-Click Cloud Deployments

#### Deploy with Vercel (Recommended)
1. Click the button below:  
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmaybesurya%2Fweather-api&project-name=maybesurya-weather&repository-name=weather-api)
2. Enter your project name and link your Git repository.
3. Configure the environment variables (see [Environment Variables](#environment-variables)).
4. Click **Deploy**.

#### Deploy to Netlify
1. Click the deploy button:  
   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/maybesurya/weather-api)
2. Connect your GitHub account and repository.
3. Set the build command to `npm run build` and publish directory to `.next`.
4. Add environment variables and click **Deploy Site**.

#### Deploy to Render
1. Click the deploy button:  
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/maybesurya/weather-api)
2. Select **Web Service**.
3. Choose the **Node** runtime, set Build Command to `npm install && npm run build`, and Start Command to `npm start`.
4. Add environment variables and deploy.

---

### Option 2: Docker Deployment

A lightweight, multi-stage [`Dockerfile`](Dockerfile) and [`docker-compose.yml`](docker-compose.yml) are pre-configured.

#### Using Docker Compose (Fastest)

```bash
# Clone the repository
git clone https://github.com/maybesurya/weather-api.git
cd weather-api

# Start the containerized application
docker compose up -d
```
The application will be live at `http://localhost:3000`.

#### Using Docker CLI

```bash
# Build the production Docker image
docker build -t maybesurya-weather .

# Run the container
docker run -d \
  -p 3000:3000 \
  --name maybesurya-weather \
  -e WEATHER_PROVIDER_PRIMARY=open-meteo \
  -e WEATHER_PROVIDER_FALLBACKS=met-no \
  -e WEATHER_PROVIDER_USER_AGENT="maybesurya-weather/1.0 (+https://weather.maybesurya.dev)" \
  maybesurya-weather
```

---

### Option 3: VPS Deployment (Ubuntu / Debian)

Follow these steps to host on any VPS provider (DigitalOcean, AWS EC2, Linode, Hetzner, Vultr):

#### 1. Server Preparation
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 process manager globally
sudo npm install -g pm2
```

#### 2. Clone & Build
```bash
git clone https://github.com/maybesurya/weather-api.git /var/www/weather-api
cd /var/www/weather-api

npm install
cp .env.example .env.local
# Edit .env.local with your preferred nano/vim editor
nano .env.local

npm run build
```

#### 3. Start Application with PM2
```bash
pm2 start npm --name "maybesurya-weather" -- start
pm2 save
pm2 startup
```

#### 4. Configure Nginx Reverse Proxy
Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/weather
```

Add the following configuration (replace `weather.yourdomain.com` with your domain):
```nginx
server {
    listen 80;
    server_name weather.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/weather /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Secure with Free SSL (Let's Encrypt / Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d weather.yourdomain.com
```

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `WEATHER_PROVIDER_PRIMARY` | Primary weather provider | `open-meteo` |
| `WEATHER_PROVIDER_FALLBACKS` | Comma-separated fallback providers | `met-no` |
| `WEATHER_PROVIDER_USER_AGENT` | Custom User-Agent for provider compliance | Required in production |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL for distributed rate limiting | In-memory dev fallback if unset |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token | In-memory dev fallback if unset |
| `RATE_LIMIT_FAIL_MODE` | Rate limiter failure strategy (`open` or `closed`) | `closed` |

---

## Verification & Testing

Run unit and integration test suites:
```bash
npm test
```

Run TypeScript and code quality checks:
```bash
npx tsc --noEmit
npm run lint
```

Build for production:
```bash
npm run build
```

---

## Data Attribution & Acknowledgements

- **Open-Meteo**: Weather forecast data under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://open-meteo.com/).
- **MET Norway**: Meteorological open government data provided under Norwegian license.
- **WMO (World Meteorological Organization)**: Meteorological standards reference.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).

Crafted with ❤️ by [MaybeSurya](https://github.com/maybesurya).

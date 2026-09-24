import type { Metadata } from "next";
import { WeatherDashboard } from "./weather/components/weather-dashboard";

export const metadata: Metadata = {
  title: "Maybesurya Weather — Atmospheric Precision",
  description:
    "Real-time global weather dashboard with Apple Weather inspired telemetry, hourly forecasts, radar maps, and public developer API.",
  openGraph: {
    title: "Maybesurya Weather",
    description: "Atmospheric precision weather dashboard and public developer API.",
    url: "https://weather.maybesurya.dev",
    siteName: "maybesurya.dev",
    type: "website",
  },
};

export default function HomePage() {
  return <WeatherDashboard />;
}

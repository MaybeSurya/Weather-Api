import type { Metadata } from "next";
import { WeatherDashboard } from "./weather/components/weather-dashboard";

export const metadata: Metadata = {
  title: "Maybesurya Weather — Real-Time Forecasts",
  description:
    "Real-time global weather forecasts, 24-hour hourly outlooks, 7-day weather predictions, and clean public developer API.",
  openGraph: {
    title: "Maybesurya Weather",
    description: "Simple, accurate weather forecasts and public developer API.",
    url: "https://weather.maybesurya.dev",
    siteName: "maybesurya.dev",
    type: "website",
  },
};

export default function HomePage() {
  return <WeatherDashboard />;
}

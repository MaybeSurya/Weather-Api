"use client";

import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Moon,
  Sunrise,
  Sunset,
  Wind,
  Droplet,
  Droplets,
  Eye,
  Compass,
  Calendar,
  Radar,
  Radio,
  Gauge,
  Leaf,
  Terminal,
  Copy,
  Check,
  Search,
  MapPin,
  Map,
  X,
  History,
  AlertTriangle,
  CloudOff,
  Navigation,
  Globe,
  Lightbulb,
  ArrowRight,
  ArrowUpRight,
  User,
  Activity,
  Code,
  type LucideProps,
} from "lucide-react";

interface WeatherIconProps extends LucideProps {
  name?: string;
  description?: string;
}

export function WeatherIcon({
  name,
  description,
  className = "w-5 h-5",
  ...props
}: WeatherIconProps) {
  const n = (name || description || "").toLowerCase();

  // Condition mapping
  if (n.includes("thunder") || n.includes("storm") || n === "thunderstorm") {
    return <CloudLightning className={className} {...props} />;
  }
  if (n.includes("snow") || n.includes("ice") || n.includes("blizzard") || n === "ac_unit" || n === "cloudy_snowing") {
    return <CloudSnow className={className} {...props} />;
  }
  if (n.includes("drizzle")) {
    return <CloudDrizzle className={className} {...props} />;
  }
  if (n.includes("rain") || n.includes("shower") || n.includes("monsoon") || n === "rainy") {
    return <CloudRain className={className} {...props} />;
  }
  if (n.includes("fog") || n.includes("mist") || n.includes("haze") || n === "foggy") {
    return <CloudFog className={className} {...props} />;
  }
  if (n.includes("partly") || n.includes("mostly") || n === "partly_cloudy_day" || n === "break") {
    return <CloudSun className={className} {...props} />;
  }
  if (n.includes("cloud") || n.includes("overcast")) {
    return <Cloud className={className} {...props} />;
  }
  if (n.includes("night") || n === "bedtime" || n === "clear_night" || n === "moon") {
    return <Moon className={className} {...props} />;
  }
  if (n === "wb_twilight" || n === "sunrise") {
    return <Sunrise className={className} {...props} />;
  }
  if (n === "sunset") {
    return <Sunset className={className} {...props} />;
  }
  if (n === "wb_sunny" || n === "sun" || n.includes("clear") || n.includes("sunny")) {
    return <Sun className={className} {...props} />;
  }

  // Meteorological telemetry icons
  if (n === "location_on" || n === "pin") return <MapPin className={className} {...props} />;
  if (n === "schedule" || n === "clock") return <Calendar className={className} {...props} />;
  if (n === "calendar_month" || n === "calendar") return <Calendar className={className} {...props} />;
  if (n === "water_drop" || n === "droplet") return <Droplet className={className} {...props} />;
  if (n === "humidity" || n === "humidity_percentage" || n === "droplets") return <Droplets className={className} {...props} />;
  if (n === "air" || n === "wind") return <Wind className={className} {...props} />;
  if (n === "navigation" || n === "my_location") return <Navigation className={className} {...props} />;
  if (n === "compass") return <Compass className={className} {...props} />;
  if (n === "visibility" || n === "eye") return <Eye className={className} {...props} />;
  if (n === "radar") return <Radar className={className} {...props} />;
  if (n === "grain" || n === "station" || n === "radio") return <Radio className={className} {...props} />;
  if (n === "pressure" || n === "gauge") return <Gauge className={className} {...props} />;
  if (n === "eco" || n === "leaf") return <Leaf className={className} {...props} />;
  if (n === "search") return <Search className={className} {...props} />;
  if (n === "close" || n === "x") return <X className={className} {...props} />;
  if (n === "history") return <History className={className} {...props} />;
  if (n === "map") return <Map className={className} {...props} />;
  if (n === "terminal") return <Terminal className={className} {...props} />;
  if (n === "copy" || n === "content_copy") return <Copy className={className} {...props} />;
  if (n === "check") return <Check className={className} {...props} />;
  if (n === "crisis_alert" || n === "alert" || n === "warning") return <AlertTriangle className={className} {...props} />;
  if (n === "cloud_off") return <CloudOff className={className} {...props} />;
  if (n === "arrow_forward" || n === "arrow_right") return <ArrowRight className={className} {...props} />;
  if (n === "open" || n === "arrow_up_right") return <ArrowUpRight className={className} {...props} />;
  if (n === "user" || n === "person") return <User className={className} {...props} />;
  if (n === "activity" || n === "cloud_sync") return <Activity className={className} {...props} />;
  if (n === "code") return <Code className={className} {...props} />;
  if (n === "globe" || n === "api" || n === "public") return <Globe className={className} {...props} />;
  if (n === "lightbulb") return <Lightbulb className={className} {...props} />;

  // Default fallback
  return <Cloud className={className} {...props} />;
}

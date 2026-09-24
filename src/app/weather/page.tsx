import { redirect } from "next/navigation";

/**
 * Legacy /weather route redirect.
 * Canonical weather application is at root / (https://weather.maybesurya.dev/).
 */
export default function WeatherPageRedirect() {
  redirect("/");
}

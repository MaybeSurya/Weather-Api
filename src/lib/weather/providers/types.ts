import type {
  Coordinates,
  Location,
  WeatherProviderName,
  CurrentWeather,
} from "../types";

/**
 * Optional context passed from the service layer to each provider.
 * Providers should use resolvedLocation when available so they don't
 * need to perform their own geocoding.
 */
export interface ProviderContext {
  requestId?: string;
  timeoutMs?: number;
  resolvedLocation?: Location;
}

/**
 * Normalized weather payload returned by every provider adapter.
 * All fields use platform-canonical units and types — never provider-specific.
 */
export interface ProviderWeatherResult {
  provider: WeatherProviderName;
  location: Location;
  coordinates: Coordinates;
  weather: CurrentWeather;
  timestamp: string;
}

/**
 * Common provider contract (Section 11).
 *
 * Every provider must implement `getWeatherByCoordinates`.
 * `getWeatherByCity` is optional — only providers that natively support
 * city-name lookup (like WeatherAPI) may implement it.
 * The service layer resolves coordinates first and calls by coordinates
 * to avoid provider-specific geocoding leaking into the route.
 */
export interface IWeatherProvider {
  readonly name: WeatherProviderName;

  /**
   * Fetches and normalizes current weather for the given coordinates.
   * This is the primary method called by the service orchestrator.
   */
  getWeatherByCoordinates(
    coordinates: Coordinates,
    context?: ProviderContext
  ): Promise<ProviderWeatherResult>;

  /**
   * Optional: Fetches weather directly by city name.
   * Only implement if the provider has native city-name support that
   * provides meaningfully better results than coordinates.
   */
  getWeatherByCity?(
    city: string,
    context?: ProviderContext
  ): Promise<ProviderWeatherResult>;
}

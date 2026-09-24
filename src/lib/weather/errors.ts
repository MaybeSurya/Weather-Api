/**
 * Typed Weather Error Taxonomy (Section 41 & 7)
 * Maps domain and provider exceptions into safe, structured public API errors.
 */

export class WeatherError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR") {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InvalidWeatherRequestError extends WeatherError {
  constructor(message: string = "Invalid weather request parameter.") {
    super(message, 400, "INVALID_QUERY");
  }
}

export class LocationNotFoundError extends WeatherError {
  constructor(message: string = "The requested city could not be resolved.") {
    super(message, 404, "INVALID_CITY");
  }
}

export class ProviderTimeoutError extends WeatherError {
  constructor(provider: string, message: string = `Provider ${provider} timed out.`) {
    super(message, 504, "PROVIDER_TIMEOUT");
  }
}

export class ProviderRateLimitError extends WeatherError {
  constructor(provider: string, message: string = `Provider ${provider} rate limit reached.`) {
    super(message, 502, "PROVIDER_RATE_LIMIT");
  }
}

export class ProviderUnavailableError extends WeatherError {
  constructor(message: string = "Weather service is temporarily unavailable.") {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}

export class ProviderResponseError extends WeatherError {
  constructor(provider: string, message: string = `Invalid response payload from provider ${provider}.`) {
    super(message, 502, "UPSTREAM_PROVIDER_ERROR");
  }
}

export class RateLimitExceededError extends WeatherError {
  constructor(message: string = "Rate limit exceeded. Maximum 30 requests per minute.") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class RateLimitUnavailableError extends WeatherError {
  constructor(message: string = "Rate limiter service unavailable.") {
    super(message, 500, "RATE_LIMIT_UNAVAILABLE");
  }
}

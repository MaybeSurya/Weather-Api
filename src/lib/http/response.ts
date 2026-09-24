import { NextResponse } from "next/server";
import type { PublicWeatherErrorResponse } from "../weather/types";
import { CORS_HEADERS, SECURITY_HEADERS } from "./headers";

/**
 * Creates a standardized JSON response with mandatory security and CORS headers.
 */
export function jsonResponse<T>(
  data: T,
  init?: {
    status?: number;
    headers?: Record<string, string> | Headers;
  }
): NextResponse<T> {
  const headers = new Headers();

  // Attach default security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }

  // Attach CORS headers
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }

  // Attach custom headers if provided
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => headers.set(key, value));
    } else {
      for (const [key, value] of Object.entries(init.headers)) {
        headers.set(key, value);
      }
    }
  }

  headers.set("Content-Type", "application/json; charset=utf-8");

  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers,
  });
}

/**
 * Creates an error response adhering strictly to the Section 7 schema.
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  extraHeaders?: Record<string, string>
): NextResponse<PublicWeatherErrorResponse> {
  const payload: PublicWeatherErrorResponse = {
    status: "error",
    error: {
      code,
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return jsonResponse(payload, {
    status: statusCode,
    headers: extraHeaders,
  });
}

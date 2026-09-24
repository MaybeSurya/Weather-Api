import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, getCacheHeaders, SECURITY_HEADERS } from "@/lib/http/headers";
import { errorResponse, jsonResponse } from "@/lib/http/response";
import { extractClientIp } from "@/lib/rate-limit/ip";
import { checkRateLimit, type RateLimitResult } from "@/lib/rate-limit/weather";
import { WeatherError } from "@/lib/weather/errors";
import { weatherService } from "@/lib/weather/service";

/**
 * OPTIONS /api/weather
 * Preflight CORS handling.
 */
export async function OPTIONS(): Promise<NextResponse> {
  const headers = new Headers();
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }
  headers.set("Allow", "GET, OPTIONS");

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * GET /api/weather
 * Public weather endpoint.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  let rateLimit: RateLimitResult | undefined;

  try {
    // 1. Client IP Extraction (Section 13)
    const clientIp = extractClientIp(request.headers);

    // 2. Distributed Rate Limiting Check (Section 23, 81)
    rateLimit = await checkRateLimit(clientIp);

    if (!rateLimit.success) {
      return errorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Rate limit exceeded. Maximum 30 requests per minute.",
        429,
        rateLimit.headers
      );
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    // 3. Execute weather resolution and provider workflow
    const result = await weatherService.getWeather({
      city,
      headers: request.headers,
    });

    const cacheHeaders = getCacheHeaders(result.source);
    const combinedHeaders = {
      ...cacheHeaders,
      ...rateLimit.headers,
    };

    return jsonResponse(result.response, {
      status: 200,
      headers: combinedHeaders,
    });
  } catch (error: unknown) {
    const errorHeaders = rateLimit?.headers;

    if (error instanceof WeatherError) {
      return errorResponse(error.code, error.message, error.statusCode, errorHeaders);
    }

    // Default 500 without leaking stack traces or internal exceptions
    return errorResponse(
      "INTERNAL_ERROR",
      "An unexpected server error occurred while retrieving weather data.",
      500,
      errorHeaders
    );
  }
}

/**
 * Disallowed HTTP Methods (Section 33)
 */
function methodNotAllowed(): NextResponse {
  const headers = new Headers();
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  headers.set("Allow", "GET, OPTIONS");

  return jsonResponse(
    {
      status: "error",
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed. Supported methods: GET, OPTIONS.",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    {
      status: 405,
      headers,
    }
  );
}

export async function POST(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function PUT(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function PATCH(): Promise<NextResponse> {
  return methodNotAllowed();
}

export async function DELETE(): Promise<NextResponse> {
  return methodNotAllowed();
}

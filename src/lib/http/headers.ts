/**
 * HTTP Security, CORS, and Cache Header Utilities
 */

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/**
 * Cache policy configuration (Section 28 & 29)
 * - Explicit city requests are publicly cacheable on CDN (10m fresh, 5m stale-while-revalidate)
 * - Implicit geo requests are private, no-store to prevent cross-visitor cache leakage
 */
export function getCacheHeaders(source: "geocoding" | "cloudflare" | "fallback"): Record<string, string> {
  if (source === "geocoding") {
    return {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
      "Vercel-CDN-Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
    };
  }

  // Implicit location must not be edge-cached across distinct geographic visitors
  return {
    "Cache-Control": "private, no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
  };
}

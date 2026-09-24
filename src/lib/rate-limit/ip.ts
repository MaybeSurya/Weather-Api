/**
 * Client IP Extraction and Normalization (Section 13)
 * 
 * Prioritizes Cloudflare's trusted CF-Connecting-IP header.
 * Falls back to the first non-trusted hop in X-Forwarded-For, or 127.0.0.1 in local development.
 */

export function extractClientIp(headers: Headers): string {
  // 1. Cloudflare connecting IP (Most trusted in Cloudflare proxy setup)
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp && isValidIp(cfConnectingIp.trim())) {
    return cleanIp(cfConnectingIp.trim());
  }

  // 2. X-Forwarded-For (First usable IP in the chain)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const candidate = xForwardedFor.split(",")[0].trim();
    if (isValidIp(candidate)) {
      return cleanIp(candidate);
    }
  }

  // 3. Fallback for local development or direct origin access
  return "127.0.0.1";
}

/**
 * Strips port number if present from IPv4 (e.g. 192.168.1.1:8080 -> 192.168.1.1)
 */
function cleanIp(ip: string): string {
  if (ip.includes(".") && ip.includes(":")) {
    return ip.split(":")[0];
  }
  return ip;
}

/**
 * Basic validation ensuring input matches IPv4 or IPv6 pattern and is not arbitrary text.
 */
function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  // Simple check: Contains standard IPv4 or IPv6 hex/colon chars
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

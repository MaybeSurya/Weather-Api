import { describe, expect, it } from "vitest";
import { extractClientIp } from "@/lib/rate-limit/ip";

describe("Client IP Extraction (Section 13)", () => {
  it("prioritizes CF-Connecting-IP over other headers", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.195",
      "x-forwarded-for": "198.51.100.1, 192.0.2.1",
    });
    expect(extractClientIp(headers)).toBe("203.0.113.195");
  });

  it("extracts the first IP from X-Forwarded-For when CF-Connecting-IP is absent", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.42, 10.0.0.1",
    });
    expect(extractClientIp(headers)).toBe("198.51.100.42");
  });

  it("strips port number if present from IPv4", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.42:3456",
    });
    expect(extractClientIp(headers)).toBe("198.51.100.42");
  });

  it("falls back to 127.0.0.1 when no usable identity headers exist", () => {
    const emptyHeaders = new Headers();
    expect(extractClientIp(emptyHeaders)).toBe("127.0.0.1");

    const invalidHeaders = new Headers({
      "x-forwarded-for": "invalid-ip-string",
    });
    expect(extractClientIp(invalidHeaders)).toBe("127.0.0.1");
  });
});

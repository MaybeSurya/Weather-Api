import { describe, expect, it } from "vitest";
import { GET, OPTIONS } from "@/app/api/weather/search/route";
import { NextRequest } from "next/server";

describe("GET /api/weather/search", () => {
  it("returns empty suggestions if query is less than 2 characters", async () => {
    const req = new NextRequest("http://localhost:3000/api/weather/search?q=r");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("success");
    expect(json.suggestions).toEqual([]);
  });

  it("handles OPTIONS preflight request with 204", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Allow")).toBe("GET, OPTIONS");
  });
});

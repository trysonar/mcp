import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient, SonarApiError } from "./client.js";

describe("createClient — base URL validation", () => {
  it("accepts an HTTPS URL", () => {
    expect(() =>
      createClient({ apiKey: "aso_x", baseUrl: "https://trysonar.app" })
    ).not.toThrow();
  });

  it("accepts http://localhost for dev", () => {
    expect(() =>
      createClient({ apiKey: "aso_x", baseUrl: "http://localhost:3000" })
    ).not.toThrow();
  });

  it("rejects http:// to non-localhost", () => {
    expect(() =>
      createClient({ apiKey: "aso_x", baseUrl: "http://evil.example.com" })
    ).toThrow(/HTTPS/);
  });

  it("rejects malformed URLs", () => {
    expect(() =>
      createClient({ apiKey: "aso_x", baseUrl: "not-a-url" })
    ).toThrow(/Invalid SONAR_API_URL/);
  });
});

describe("client.get", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("sends Bearer token and Accept header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createClient({
      apiKey: "aso_secret",
      baseUrl: "https://trysonar.app",
    });
    await client.get("/api/v1/apps/lookup", { store: "ios", id: "1" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://trysonar.app/api/v1/apps/lookup?store=ios&id=1");
    expect(init.headers.Authorization).toBe("Bearer aso_secret");
    expect(init.headers.Accept).toBe("application/json");
  });

  it("omits the Authorization header entirely when apiKey is empty (free tier)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createClient({
      apiKey: "",
      baseUrl: "https://trysonar.app",
    });
    await client.get("/api/v1/apps/search", { store: "ios", q: "meditation" });

    const [, init] = fetchMock.mock.calls[0];
    // "Bearer " (empty) would 401 as an invalid key instead of reaching the
    // API's anonymous free tier — the header must be absent, not empty.
    expect(init.headers).not.toHaveProperty("Authorization");
    expect(init.headers.Accept).toBe("application/json");
  });

  it("attaches extraHeaders to every request (hosted /mcp IP forwarding)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), { status: 200 })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createClient({
      apiKey: "",
      baseUrl: "https://trysonar.app",
      extraHeaders: { "x-sonar-anon-ip": "1.2.3.4" },
    });
    await client.get("/api/v1/apps/search", { store: "ios", q: "x" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["x-sonar-anon-ip"]).toBe("1.2.3.4");
  });

  it("throws SonarApiError with API-provided code/message on 4xx", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: "rate_limited", message: "Slow down" } }),
        { status: 429 }
      )
    ) as unknown as typeof fetch;

    const client = createClient({
      apiKey: "k",
      baseUrl: "https://trysonar.app",
    });

    await expect(client.get("/api/v1/apps/lookup")).rejects.toMatchObject({
      status: 429,
      code: "rate_limited",
      message: "Slow down",
    });
  });

  it("throws SonarApiError with default message when body is not JSON", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("oops", { status: 500 })
    ) as unknown as typeof fetch;

    const client = createClient({
      apiKey: "k",
      baseUrl: "https://trysonar.app",
    });

    await expect(client.get("/api/v1/apps/lookup")).rejects.toBeInstanceOf(
      SonarApiError
    );
  });

  it("wraps fetch network errors with code: network_error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(
      new TypeError("fetch failed")
    ) as unknown as typeof fetch;

    const client = createClient({
      apiKey: "k",
      baseUrl: "https://trysonar.app",
    });

    await expect(client.get("/api/v1/apps/lookup")).rejects.toMatchObject({
      code: "network_error",
    });
  });

  it("patch sends a JSON body with the PATCH method", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { note: null } }), { status: 200 })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createClient({
      apiKey: "aso_secret",
      baseUrl: "https://trysonar.app",
    });
    await client.patch("/api/v1/tracked-keywords/tk-1", { note: null });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://trysonar.app/api/v1/tracked-keywords/tk-1");
    expect(init.method).toBe("PATCH");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ note: null });
  });

  it("skips undefined params instead of serializing 'undefined'", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 })
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const client = createClient({
      apiKey: "k",
      baseUrl: "https://trysonar.app",
    });
    await client.get("/api/v1/apps/reviews", {
      store: "ios",
      id: "1",
      country: "us",
      max_rating: undefined,
    });

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).not.toMatch(/max_rating/);
  });
});

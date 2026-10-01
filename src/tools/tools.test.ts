import { describe, it, expect, vi } from "vitest";
import type { ApiClient } from "../client.js";
import { SonarApiError } from "../client.js";
import { runTool, tools, toolsByName } from "./index.js";

function mockClient(
  impl: ApiClient["get"],
  postImpl?: ApiClient["post"],
  patchImpl?: ApiClient["patch"],
  deleteImpl?: ApiClient["delete"],
  requestImpl?: ApiClient["request"]
): ApiClient {
  return {
    get: impl as ApiClient["get"],
    post: (postImpl ??
      (async () => {
        throw new Error("post should not be called");
      })) as ApiClient["post"],
    patch: (patchImpl ??
      (async () => {
        throw new Error("patch should not be called");
      })) as ApiClient["patch"],
    delete: (deleteImpl ??
      (async () => {
        throw new Error("delete should not be called");
      })) as ApiClient["delete"],
    request: (requestImpl ??
      (async () => {
        throw new Error("request should not be called");
      })) as ApiClient["request"],
  };
}

function mockPostClient(impl: ApiClient["post"]): ApiClient {
  return mockClient(async () => {
    throw new Error("get should not be called");
  }, impl);
}

function mockPatchClient(impl: ApiClient["patch"]): ApiClient {
  return mockClient(
    async () => {
      throw new Error("get should not be called");
    },
    undefined,
    impl
  );
}

function mockDeleteClient(impl: ApiClient["delete"]): ApiClient {
  return mockClient(
    async () => {
      throw new Error("get should not be called");
    },
    undefined,
    undefined,
    impl
  );
}

describe("tools registry", () => {
  it("exposes the 27 read tools, 16 write tools, and 12 screenshot tools", () => {
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        // Stateless reads
        "sonar_app_aso_score",
        "sonar_app_extract_keywords",
        "sonar_app_lookup",
        "sonar_app_reviews",
        "sonar_app_revenue",
        "sonar_app_search",
        "sonar_keyword_metrics",
        "sonar_keyword_search",
        "sonar_keyword_suggestions",
        "sonar_top_charts",
        // Org-scoped reads
        "sonar_list_apps",
        "sonar_get_app",
        "sonar_app_keywords",
        "sonar_app_rankings",
        "sonar_app_changes",
        "sonar_keyword_rankings",
        "sonar_competitor_keywords",
        "sonar_competitor_landscape",
        "sonar_list_products",
        "sonar_list_alerts",
        "sonar_alert_events",
        "sonar_app_overview",
        "sonar_discovered_keywords",
        "sonar_review_insights",
        "sonar_portfolio",
        "sonar_app_sales",
        "sonar_app_engagement",
        // Writes
        "sonar_create_product",
        "sonar_track_app",
        "sonar_track_competitor",
        "sonar_track_keywords",
        "sonar_update_keyword_note",
        "sonar_star_keyword",
        "sonar_scan_competitor",
        "sonar_analyze_competitors",
        "sonar_generate_review_insights",
        "sonar_delete_tracked_keyword",
        "sonar_export_screenshots",
        "sonar_untrack_keywords",
        "sonar_untrack_app",
        "sonar_delete_product",
        "sonar_remove_competitor",
        "sonar_set_alert",
        "sonar_delete_alert",
        // Screenshot Studio
        "sonar_screenshot_layout_guide",
        "sonar_screenshot_devices",
        "sonar_list_screenshot_sets",
        "sonar_create_screenshot_set",
        "sonar_get_screenshot_set",
        "sonar_update_screenshot_set",
        "sonar_delete_screenshot_set",
        "sonar_add_screenshot",
        "sonar_update_screenshot",
        "sonar_delete_screenshot",
        "sonar_set_screenshot_translations",
      ].sort()
    );
  });

  it("write tools carry mutation annotations and say WRITE in the description", () => {
    const writeTools = [
      "sonar_create_product",
      "sonar_track_app",
      "sonar_track_competitor",
      "sonar_track_keywords",
      "sonar_update_keyword_note",
      "sonar_star_keyword",
      "sonar_scan_competitor",
      "sonar_analyze_competitors",
      "sonar_generate_review_insights",
      "sonar_delete_tracked_keyword",
      "sonar_untrack_keywords",
      "sonar_untrack_app",
      "sonar_delete_product",
      "sonar_remove_competitor",
      "sonar_set_alert",
      "sonar_delete_alert",
    ];
    for (const name of writeTools) {
      expect(toolsByName[name].annotations?.readOnlyHint).toBe(false);
      expect(toolsByName[name].description).toMatch(/WRITE/);
    }
  });

  it("delete tools are annotated destructive + idempotent", () => {
    const deleteTools = [
      "sonar_delete_tracked_keyword",
      "sonar_untrack_keywords",
      "sonar_untrack_app",
      "sonar_delete_product",
      "sonar_remove_competitor",
      "sonar_delete_alert",
    ];
    for (const name of deleteTools) {
      expect(toolsByName[name].annotations?.destructiveHint).toBe(true);
      expect(toolsByName[name].annotations?.idempotentHint).toBe(true);
    }
  });

  it("org-scoped read tools are annotated read-only", () => {
    const orgReadTools = [
      "sonar_list_apps",
      "sonar_get_app",
      "sonar_app_keywords",
      "sonar_app_rankings",
      "sonar_app_changes",
      "sonar_keyword_rankings",
      "sonar_competitor_keywords",
      "sonar_list_products",
      "sonar_list_alerts",
      "sonar_alert_events",
      "sonar_app_overview",
      "sonar_discovered_keywords",
      "sonar_review_insights",
      "sonar_portfolio",
      "sonar_app_sales",
      "sonar_app_engagement",
    ];
    for (const name of orgReadTools) {
      expect(toolsByName[name].annotations?.readOnlyHint).toBe(true);
    }
  });

  it("every tool has a non-empty description", () => {
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(20);
    }
  });

  it("every tool has a title and a readOnlyHint (directory requirement)", () => {
    for (const tool of tools) {
      expect(tool.title.length, tool.name).toBeGreaterThan(2);
      expect(tool.title.length, tool.name).toBeLessThanOrEqual(40);
      expect(typeof tool.annotations?.readOnlyHint, tool.name).toBe("boolean");
    }
  });

  it("toolsByName resolves every registered tool", () => {
    for (const tool of tools) {
      expect(toolsByName[tool.name]).toBe(tool);
    }
  });
});

describe("runTool — input validation", () => {
  it("returns isError when required args are missing", async () => {
    const client = mockClient(async () => {
      throw new Error("should not be called");
    });
    const tool = toolsByName.sonar_app_lookup;
    const result = await runTool(tool, {}, client);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Invalid arguments/);
    expect(result.content[0].text).toMatch(/store/);
    expect(result.content[0].text).toMatch(/store_id/);
  });

  it("returns isError when arg type is wrong", async () => {
    const client = mockClient(async () => {
      throw new Error("should not be called");
    });
    const tool = toolsByName.sonar_app_search;
    const result = await runTool(
      tool,
      { query: "meditation", store: "ios", num: "ten" },
      client
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/num/);
  });
});

describe("runTool — happy path per tool", () => {
  it("sonar_app_lookup hits /api/v1/apps/lookup with correct params", async () => {
    const get = vi.fn().mockResolvedValue({ data: { name: "Spotify" } });
    const result = await runTool(
      toolsByName.sonar_app_lookup,
      { store: "android", store_id: "com.spotify.music", country: "us" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps/lookup", {
      store: "android",
      id: "com.spotify.music",
      country: "us",
    });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual({ name: "Spotify" });
  });

  it("sonar_app_search uses q (not query) and num (not limit)", async () => {
    const get = vi.fn().mockResolvedValue({ data: [] });
    await runTool(
      toolsByName.sonar_app_search,
      { query: "meditation", store: "ios", country: "gb", num: 25 },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps/search", {
      q: "meditation",
      store: "ios",
      country: "gb",
      num: 25,
    });
  });

  it("sonar_app_aso_score forwards all required fields", async () => {
    const get = vi.fn().mockResolvedValue({ data: { score: 72 } });
    await runTool(
      toolsByName.sonar_app_aso_score,
      { store: "ios", store_id: "324684580", country: "us" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps/aso-score", {
      store: "ios",
      id: "324684580",
      country: "us",
    });
  });

  it("sonar_app_extract_keywords passes max", async () => {
    const get = vi.fn().mockResolvedValue({ data: { keywords: [] } });
    await runTool(
      toolsByName.sonar_app_extract_keywords,
      { store: "android", store_id: "com.example", country: "us", max: 30 },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith(
      "/api/v1/apps/extract-keywords",
      expect.objectContaining({ max: 30, store: "android" })
    );
  });

  it("sonar_app_reviews forwards filter args", async () => {
    const get = vi.fn().mockResolvedValue({ data: [] });
    await runTool(
      toolsByName.sonar_app_reviews,
      {
        store: "android",
        store_id: "com.test",
        country: "ma",
        lang: "fr",
        sort: "helpful",
        min_rating: 4,
        limit: 50,
      },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps/reviews", {
      store: "android",
      id: "com.test",
      country: "ma",
      lang: "fr",
      sort: "helpful",
      min_rating: 4,
      max_rating: undefined,
      limit: 50,
    });
  });

  it("sonar_app_revenue forwards required fields", async () => {
    const get = vi.fn().mockResolvedValue({ data: { revenue: { monthly: 1000 } } });
    await runTool(
      toolsByName.sonar_app_revenue,
      { store: "ios", store_id: "324684580", country: "us" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps/revenue", {
      store: "ios",
      id: "324684580",
      country: "us",
    });
  });

  it("sonar_keyword_search uses q (not query)", async () => {
    const get = vi.fn().mockResolvedValue({ data: [] });
    await runTool(
      toolsByName.sonar_keyword_search,
      { query: "yoga", store: "ios", country: "us" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/keywords/search", {
      q: "yoga",
      store: "ios",
      country: "us",
    });
  });

  it("sonar_keyword_suggestions maps seed → q", async () => {
    const get = vi.fn().mockResolvedValue({ data: [] });
    await runTool(
      toolsByName.sonar_keyword_suggestions,
      { seed: "med", store: "ios", country: "us" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/keywords/suggestions", {
      q: "med",
      store: "ios",
      country: "us",
    });
  });

  it("sonar_top_charts passes chart params through with defaults applied", async () => {
    const get = vi.fn().mockResolvedValue({ data: { entries: [] } });
    await runTool(toolsByName.sonar_top_charts, { store: "ios" }, mockClient(get));

    expect(get).toHaveBeenCalledWith("/api/v1/charts/top", {
      store: "ios",
      country: "us",
      chart: "free",
      category: "overall",
      limit: 50,
    });
  });

  it("sonar_top_charts rejects an out-of-range limit", async () => {
    const get = vi.fn();
    const result = await runTool(
      toolsByName.sonar_top_charts,
      { store: "ios", limit: 500 },
      mockClient(get)
    );

    expect(result.isError).toBe(true);
    expect(get).not.toHaveBeenCalled();
  });

  it("sonar_list_products hits /api/v1/products with no params", async () => {
    const get = vi.fn().mockResolvedValue({ data: [{ id: "p1" }] });
    const result = await runTool(
      toolsByName.sonar_list_products,
      {},
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/products");
    expect(JSON.parse(result.content[0].text)).toEqual([{ id: "p1" }]);
  });
});

describe("org-scoped read tools — happy path", () => {
  const paginated = (data: unknown[], nextCursor: string | null = null) => ({
    data,
    pagination: { next_cursor: nextCursor, has_more: nextCursor !== null },
  });

  it("sonar_list_apps hits /api/v1/apps and unwraps pagination", async () => {
    const get = vi
      .fn()
      .mockResolvedValue(paginated([{ id: "app-1", name: "MyFit" }], "cur-2"));
    const result = await runTool(
      toolsByName.sonar_list_apps,
      { limit: 50 },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps", {
      cursor: undefined,
      limit: 50,
    });
    const body = JSON.parse(result.content[0].text);
    expect(body.apps[0].id).toBe("app-1");
    expect(body.next_cursor).toBe("cur-2");
  });

  it("sonar_get_app hits /api/v1/apps/{id} and URL-encodes the id", async () => {
    const get = vi.fn().mockResolvedValue({ data: { id: "app 1" } });
    await runTool(
      toolsByName.sonar_get_app,
      { app_id: "app 1" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps/app%201");
  });

  it("sonar_app_keywords hits /api/v1/apps/{id}/keywords with cursor", async () => {
    const get = vi.fn().mockResolvedValue(paginated([]));
    await runTool(
      toolsByName.sonar_app_keywords,
      { app_id: "app-1", cursor: "cur-1" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps/app-1/keywords", {
      cursor: "cur-1",
      limit: undefined,
    });
  });

  it("sonar_app_rankings forwards days and keyword_id", async () => {
    const get = vi.fn().mockResolvedValue(paginated([]));
    await runTool(
      toolsByName.sonar_app_rankings,
      { app_id: "app-1", days: 90, keyword_id: "kw-1" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps/app-1/rankings", {
      days: 90,
      keyword_id: "kw-1",
      cursor: undefined,
      limit: undefined,
    });
  });

  it("sonar_app_changes forwards the type filter", async () => {
    const get = vi.fn().mockResolvedValue({ data: [] });
    await runTool(
      toolsByName.sonar_app_changes,
      { app_id: "app-1", type: "release", limit: 10 },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/apps/app-1/changes", {
      type: "release",
      limit: 10,
    });
  });

  it("sonar_app_changes rejects an invalid type", async () => {
    const result = await runTool(
      toolsByName.sonar_app_changes,
      { app_id: "app-1", type: "weather" },
      mockClient(async () => {
        throw new Error("should not be called");
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/type/);
  });

  it("sonar_keyword_rankings hits /api/v1/keywords/{id}/rankings", async () => {
    const get = vi.fn().mockResolvedValue({ data: { entries: [] } });
    await runTool(
      toolsByName.sonar_keyword_rankings,
      { keyword_id: "kw-1", days: 7 },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/keywords/kw-1/rankings", {
      days: 7,
    });
  });

  it("sonar_competitor_keywords maps own_app_id → app_id", async () => {
    const get = vi.fn().mockResolvedValue(paginated([]));
    await runTool(
      toolsByName.sonar_competitor_keywords,
      { competitor_app_id: "comp-1", own_app_id: "app-1" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/competitors/comp-1/keywords", {
      app_id: "app-1",
      cursor: undefined,
      limit: undefined,
    });
  });

  it("sonar_competitor_landscape GETs the landscape for an own app", async () => {
    const get = vi.fn().mockResolvedValue({
      data: { app_id: "x", stats: { gaps: 3 }, insight: null },
    });
    const result = await runTool(
      toolsByName.sonar_competitor_landscape,
      { app_id: "6c9b9f4f-2d3e-5f60-9bac-1d2e3f4a5b6c" },
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith(
      "/api/v1/apps/6c9b9f4f-2d3e-5f60-9bac-1d2e3f4a5b6c/competitor-landscape"
    );
    expect(JSON.parse(result.content[0].text).stats.gaps).toBe(3);
  });

  it("sonar_competitor_landscape rejects non-UUID ids before calling the API", async () => {
    const result = await runTool(
      toolsByName.sonar_competitor_landscape,
      { app_id: "com.example.app" },
      mockClient(async () => {
        throw new Error("should not be called");
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Invalid arguments/);
  });
});

describe("write tools — input validation", () => {
  it("sonar_create_product requires a non-empty apps array", async () => {
    const result = await runTool(
      toolsByName.sonar_create_product,
      { apps: [] },
      mockPostClient(async () => {
        throw new Error("should not be called");
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Invalid arguments/);
    expect(result.content[0].text).toMatch(/apps/);
  });

  it("sonar_track_keywords requires app_id and keywords", async () => {
    const result = await runTool(
      toolsByName.sonar_track_keywords,
      {},
      mockPostClient(async () => {
        throw new Error("should not be called");
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/app_id/);
    expect(result.content[0].text).toMatch(/keywords/);
  });

  it("sonar_track_competitor rejects an invalid store", async () => {
    const result = await runTool(
      toolsByName.sonar_track_competitor,
      { product_id: "p-1", store: "windows", store_id: "x" },
      mockPostClient(async () => {
        throw new Error("should not be called");
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/store/);
  });
});

describe("write tools — happy path", () => {
  it("sonar_create_product POSTs /api/v1/products with apps and name", async () => {
    const post = vi
      .fn()
      .mockResolvedValue({ data: { id: "prod-1", apps: [{ id: "app-1" }] } });
    const result = await runTool(
      toolsByName.sonar_create_product,
      {
        apps: [{ store: "ios", store_id: "324684580", country: "us" }],
        name: "MyFit Habits",
      },
      mockPostClient(post)
    );

    expect(post).toHaveBeenCalledWith("/api/v1/products", {
      apps: [{ store: "ios", store_id: "324684580", country: "us" }],
      name: "MyFit Habits",
    });
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text).id).toBe("prod-1");
  });

  it("sonar_track_app POSTs /api/v1/products/{id}/apps", async () => {
    const post = vi.fn().mockResolvedValue({ data: { product_id: "prod-1" } });
    await runTool(
      toolsByName.sonar_track_app,
      { product_id: "prod-1", store: "android", store_id: "com.example" },
      mockPostClient(post)
    );

    expect(post).toHaveBeenCalledWith("/api/v1/products/prod-1/apps", {
      store: "android",
      store_id: "com.example",
    });
  });

  it("sonar_track_competitor POSTs /api/v1/products/{id}/competitors", async () => {
    const post = vi
      .fn()
      .mockResolvedValue({ data: { competitor: { id: "app-2" } } });
    await runTool(
      toolsByName.sonar_track_competitor,
      { product_id: "prod-1", store: "ios", store_id: "963034692", country: "gb" },
      mockPostClient(post)
    );

    expect(post).toHaveBeenCalledWith("/api/v1/products/prod-1/competitors", {
      store: "ios",
      store_id: "963034692",
      country: "gb",
    });
  });

  it("sonar_track_keywords POSTs the keywords array to /api/v1/apps/{id}/keywords", async () => {
    const post = vi.fn().mockResolvedValue({
      data: { added: 2, already_tracked: 0, failed: [], results: [] },
    });
    const result = await runTool(
      toolsByName.sonar_track_keywords,
      { app_id: "app-1", keywords: ["habit tracker", "daily habits"] },
      mockPostClient(post)
    );

    expect(post).toHaveBeenCalledWith("/api/v1/apps/app-1/keywords", {
      keywords: ["habit tracker", "daily habits"],
    });
    expect(JSON.parse(result.content[0].text).added).toBe(2);
  });

  it("sonar_update_keyword_note PATCHes /api/v1/tracked-keywords/{id}", async () => {
    const patch = vi.fn().mockResolvedValue({
      data: { id: "tk-1", note: "push for top 10" },
    });
    const result = await runTool(
      toolsByName.sonar_update_keyword_note,
      { tracked_keyword_id: "tk-1", note: "push for top 10" },
      mockPatchClient(patch)
    );

    expect(patch).toHaveBeenCalledWith("/api/v1/tracked-keywords/tk-1", {
      note: "push for top 10",
    });
    expect(JSON.parse(result.content[0].text).note).toBe("push for top 10");
  });

  it("sonar_update_keyword_note passes note: null through to clear", async () => {
    const patch = vi.fn().mockResolvedValue({ data: { id: "tk-1", note: null } });
    await runTool(
      toolsByName.sonar_update_keyword_note,
      { tracked_keyword_id: "tk-1", note: null },
      mockPatchClient(patch)
    );

    expect(patch).toHaveBeenCalledWith("/api/v1/tracked-keywords/tk-1", {
      note: null,
    });
  });

  it("sonar_star_keyword PATCHes starred: true to /api/v1/tracked-keywords/{id}", async () => {
    const patch = vi.fn().mockResolvedValue({
      data: { id: "tk-1", starred_at: "2026-07-10T12:00:00.000Z" },
    });
    const result = await runTool(
      toolsByName.sonar_star_keyword,
      { tracked_keyword_id: "tk-1", starred: true },
      mockPatchClient(patch)
    );

    expect(patch).toHaveBeenCalledWith("/api/v1/tracked-keywords/tk-1", {
      starred: true,
    });
    expect(JSON.parse(result.content[0].text).starred_at).toBe(
      "2026-07-10T12:00:00.000Z"
    );
  });

  it("sonar_star_keyword PATCHes starred: false to unstar", async () => {
    const patch = vi.fn().mockResolvedValue({
      data: { id: "tk-1", starred_at: null },
    });
    await runTool(
      toolsByName.sonar_star_keyword,
      { tracked_keyword_id: "tk-1", starred: false },
      mockPatchClient(patch)
    );

    expect(patch).toHaveBeenCalledWith("/api/v1/tracked-keywords/tk-1", {
      starred: false,
    });
  });

  it("sonar_scan_competitor POSTs own_app_id to /api/v1/competitors/{id}/scan", async () => {
    const post = vi.fn().mockResolvedValue({
      data: { discovered: 12, ranked: 24 },
    });
    const result = await runTool(
      toolsByName.sonar_scan_competitor,
      {
        competitor_app_id: "5b8a8f3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
        own_app_id: "6c9b9f4f-2d3e-5f60-9bac-1d2e3f4a5b6c",
      },
      mockPostClient(post)
    );

    expect(post).toHaveBeenCalledWith(
      "/api/v1/competitors/5b8a8f3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b/scan",
      { own_app_id: "6c9b9f4f-2d3e-5f60-9bac-1d2e3f4a5b6c" }
    );
    expect(JSON.parse(result.content[0].text).discovered).toBe(12);
  });

  it("sonar_analyze_competitors POSTs to the competitor-landscape endpoint", async () => {
    const post = vi.fn().mockResolvedValue({
      data: { app_id: "x", insight: { posture: "leader" } },
    });
    const result = await runTool(
      toolsByName.sonar_analyze_competitors,
      { app_id: "6c9b9f4f-2d3e-5f60-9bac-1d2e3f4a5b6c" },
      mockPostClient(post)
    );

    expect(post).toHaveBeenCalledWith(
      "/api/v1/apps/6c9b9f4f-2d3e-5f60-9bac-1d2e3f4a5b6c/competitor-landscape",
      {}
    );
    expect(JSON.parse(result.content[0].text).insight.posture).toBe("leader");
  });

  it("sonar_scan_competitor rejects non-UUID ids before calling the API", async () => {
    const result = await runTool(
      toolsByName.sonar_scan_competitor,
      { competitor_app_id: "com.spotify.music", own_app_id: "also-not-a-uuid" },
      mockPostClient(async () => {
        throw new Error("should not be called");
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Invalid arguments/);
  });
});

describe("write tools — 401/403 mapped to an actionable message", () => {
  it.each([
    ["sonar_create_product", { apps: [{ store: "ios", store_id: "1" }] }],
    [
      "sonar_track_app",
      { product_id: "p-1", store: "ios", store_id: "1" },
    ],
    [
      "sonar_track_competitor",
      { product_id: "p-1", store: "ios", store_id: "1" },
    ],
    ["sonar_track_keywords", { app_id: "a-1", keywords: ["yoga"] }],
    [
      "sonar_scan_competitor",
      {
        competitor_app_id: "5b8a8f3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
        own_app_id: "6c9b9f4f-2d3e-5f60-9bac-1d2e3f4a5b6c",
      },
    ],
  ] as const)("%s explains scope + plan on 403", async (name, args) => {
    const client = mockPostClient(async () => {
      throw new SonarApiError(
        403,
        "forbidden",
        "This API key does not have the `write` scope."
      );
    });
    const result = await runTool(toolsByName[name], args, client);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/write.*scope/i);
    expect(result.content[0].text).toMatch(/settings\/developers/);
    expect(result.content[0].text).toMatch(/Indie plan/);
    expect(result.content[0].text).toMatch(/trial counts/);
  });

  it("sonar_update_keyword_note explains scope + plan on 403 (PATCH path)", async () => {
    const client = mockPatchClient(async () => {
      throw new SonarApiError(
        403,
        "forbidden",
        "This API key does not have the `write` scope."
      );
    });
    const result = await runTool(
      toolsByName.sonar_update_keyword_note,
      { tracked_keyword_id: "tk-1", note: "hello" },
      client
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/write.*scope/i);
    expect(result.content[0].text).toMatch(/settings\/developers/);
  });

  it("maps 401 the same way", async () => {
    const client = mockPostClient(async () => {
      throw new SonarApiError(401, "unauthorized", "Bad API key");
    });
    const result = await runTool(
      toolsByName.sonar_track_keywords,
      { app_id: "a-1", keywords: ["yoga"] },
      client
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/401/);
    expect(result.content[0].text).toMatch(/settings\/developers/);
  });

  it("does not rewrite non-auth errors", async () => {
    const client = mockPostClient(async () => {
      throw new SonarApiError(404, "not_found", "Product not found");
    });
    const result = await runTool(
      toolsByName.sonar_track_app,
      { product_id: "missing", store: "ios", store_id: "1" },
      client
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Product not found/);
    expect(result.content[0].text).not.toMatch(/settings\/developers/);
  });
});

describe("new read tools — happy path", () => {
  it("sonar_list_products GETs /api/v1/products and returns data", async () => {
    const get = vi
      .fn()
      .mockResolvedValue({ data: [{ id: "prod-1", name: "MyFit" }] });
    const result = await runTool(
      toolsByName.sonar_list_products,
      {},
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/products");
    expect(JSON.parse(result.content[0].text)[0].id).toBe("prod-1");
  });

  it("sonar_list_alerts GETs /api/v1/alerts and returns data", async () => {
    const get = vi
      .fn()
      .mockResolvedValue({ data: [{ id: "rule-1", type: "rank_drop" }] });
    const result = await runTool(
      toolsByName.sonar_list_alerts,
      {},
      mockClient(get)
    );

    expect(get).toHaveBeenCalledWith("/api/v1/alerts");
    expect(JSON.parse(result.content[0].text)[0].type).toBe("rank_drop");
  });
});

describe("delete/untrack write tools — happy path", () => {
  it("sonar_delete_tracked_keyword DELETEs /api/v1/tracked-keywords/{id}", async () => {
    const del = vi.fn().mockResolvedValue({ data: { id: "tk-1", deleted: true } });
    const result = await runTool(
      toolsByName.sonar_delete_tracked_keyword,
      { tracked_keyword_id: "tk-1" },
      mockDeleteClient(del)
    );

    expect(del).toHaveBeenCalledWith("/api/v1/tracked-keywords/tk-1", undefined);
    expect(JSON.parse(result.content[0].text).deleted).toBe(true);
  });

  it("sonar_untrack_keywords with all:true passes all=true query", async () => {
    const del = vi.fn().mockResolvedValue({ data: { deleted: 5, requested: null } });
    await runTool(
      toolsByName.sonar_untrack_keywords,
      { app_id: "app-1", all: true },
      mockDeleteClient(del)
    );

    expect(del).toHaveBeenCalledWith("/api/v1/apps/app-1/keywords", {
      all: "true",
    });
  });

  it("sonar_untrack_keywords with ids joins them comma-separated", async () => {
    const del = vi.fn().mockResolvedValue({ data: { deleted: 2, requested: 2 } });
    await runTool(
      toolsByName.sonar_untrack_keywords,
      { app_id: "app-1", ids: ["tk-1", "tk-2"] },
      mockDeleteClient(del)
    );

    expect(del).toHaveBeenCalledWith("/api/v1/apps/app-1/keywords", {
      ids: "tk-1,tk-2",
    });
  });

  it("sonar_untrack_keywords errors when neither all nor ids given", async () => {
    const result = await runTool(
      toolsByName.sonar_untrack_keywords,
      { app_id: "app-1" },
      mockDeleteClient(async () => {
        throw new Error("delete should not be called");
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/exactly one/i);
  });

  it("sonar_untrack_keywords errors when both all and ids given", async () => {
    const result = await runTool(
      toolsByName.sonar_untrack_keywords,
      { app_id: "app-1", all: true, ids: ["tk-1"] },
      mockDeleteClient(async () => {
        throw new Error("delete should not be called");
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/exactly one/i);
  });

  it("sonar_untrack_app DELETEs /api/v1/apps/{id}", async () => {
    const del = vi.fn().mockResolvedValue({ data: { id: "app-1", deleted: true } });
    await runTool(
      toolsByName.sonar_untrack_app,
      { app_id: "app-1" },
      mockDeleteClient(del)
    );

    expect(del).toHaveBeenCalledWith("/api/v1/apps/app-1", undefined);
  });

  it("sonar_delete_product DELETEs /api/v1/products/{id}", async () => {
    const del = vi
      .fn()
      .mockResolvedValue({ data: { id: "prod-1", deleted: true, untracked_apps: 2 } });
    const result = await runTool(
      toolsByName.sonar_delete_product,
      { product_id: "prod-1" },
      mockDeleteClient(del)
    );

    expect(del).toHaveBeenCalledWith("/api/v1/products/prod-1", undefined);
    expect(JSON.parse(result.content[0].text).untracked_apps).toBe(2);
  });

  it("sonar_remove_competitor DELETEs the nested competitor path", async () => {
    const del = vi.fn().mockResolvedValue({
      data: { product_id: "prod-1", competitor_app_id: "app-2", deleted: true, edges_removed: 1 },
    });
    await runTool(
      toolsByName.sonar_remove_competitor,
      { product_id: "prod-1", competitor_app_id: "app-2" },
      mockDeleteClient(del)
    );

    expect(del).toHaveBeenCalledWith(
      "/api/v1/products/prod-1/competitors/app-2",
      undefined
    );
  });

  it("sonar_delete_alert DELETEs /api/v1/alerts/{id}", async () => {
    const del = vi.fn().mockResolvedValue({ data: { id: "rule-1", deleted: true } });
    await runTool(
      toolsByName.sonar_delete_alert,
      { id: "rule-1" },
      mockDeleteClient(del)
    );

    expect(del).toHaveBeenCalledWith("/api/v1/alerts/rule-1", undefined);
  });

  it("sonar_set_alert POSTs the rule to /api/v1/alerts", async () => {
    const post = vi
      .fn()
      .mockResolvedValue({ data: { id: "rule-1", type: "rank_drop" } });
    const result = await runTool(
      toolsByName.sonar_set_alert,
      { type: "rank_drop", scope_app_id: "app-1", threshold: 5, enabled: true },
      mockPostClient(post)
    );

    expect(post).toHaveBeenCalledWith("/api/v1/alerts", {
      type: "rank_drop",
      scope_app_id: "app-1",
      threshold: 5,
      enabled: true,
    });
    expect(JSON.parse(result.content[0].text).id).toBe("rule-1");
  });

  it("sonar_set_alert omits unset optional fields", async () => {
    const post = vi.fn().mockResolvedValue({ data: { id: "rule-1" } });
    await runTool(
      toolsByName.sonar_set_alert,
      { type: "review_spike" },
      mockPostClient(post)
    );

    expect(post).toHaveBeenCalledWith("/api/v1/alerts", { type: "review_spike" });
  });

  it("sonar_set_alert rejects an invalid alert type", async () => {
    const result = await runTool(
      toolsByName.sonar_set_alert,
      { type: "earthquake" },
      mockPostClient(async () => {
        throw new Error("post should not be called");
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/type/);
  });
});

describe("delete write tools — 401/403 mapped to an actionable message", () => {
  it.each([
    ["sonar_delete_tracked_keyword", { tracked_keyword_id: "tk-1" }],
    ["sonar_untrack_app", { app_id: "app-1" }],
    ["sonar_delete_product", { product_id: "prod-1" }],
    ["sonar_remove_competitor", { product_id: "prod-1", competitor_app_id: "app-2" }],
    ["sonar_delete_alert", { id: "rule-1" }],
  ] as const)("%s explains scope + plan on 403", async (name, args) => {
    const client = mockDeleteClient(async () => {
      throw new SonarApiError(403, "forbidden", "No write scope.");
    });
    const result = await runTool(toolsByName[name], args, client);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/write.*scope/i);
    expect(result.content[0].text).toMatch(/settings\/developers/);
    expect(result.content[0].text).toMatch(/Indie plan/);
  });
});

describe("runTool — error mapping", () => {
  it("formats SonarApiError as isError content", async () => {
    const client = mockClient(async () => {
      throw new SonarApiError(401, "unauthorized", "Bad API key");
    });
    const result = await runTool(
      toolsByName.sonar_app_lookup,
      { store: "ios", store_id: "1", country: "us" },
      client
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/401/);
    expect(result.content[0].text).toMatch(/unauthorized/);
    expect(result.content[0].text).toMatch(/Bad API key/);
  });

  it("formats unexpected errors as isError content", async () => {
    const client = mockClient(async () => {
      throw new Error("disk on fire");
    });
    const result = await runTool(
      toolsByName.sonar_app_lookup,
      { store: "ios", store_id: "1", country: "us" },
      client
    );

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/disk on fire/);
  });
});

describe("country default", () => {
  it("country defaults to 'us' when omitted", async () => {
    const get = vi.fn().mockResolvedValue({ data: {} });
    await runTool(
      toolsByName.sonar_app_lookup,
      { store: "ios", store_id: "1" },
      mockClient(get)
    );
    expect(get).toHaveBeenCalledWith(
      "/api/v1/apps/lookup",
      expect.objectContaining({ country: "us" })
    );
  });

  it("country is lowercased", async () => {
    const get = vi.fn().mockResolvedValue({ data: {} });
    await runTool(
      toolsByName.sonar_app_lookup,
      { store: "ios", store_id: "1", country: "GB" },
      mockClient(get)
    );
    expect(get).toHaveBeenCalledWith(
      "/api/v1/apps/lookup",
      expect.objectContaining({ country: "gb" })
    );
  });
});

describe("phase-1 coverage tools (discovered keywords, alert events, review insights)", () => {
  it("sonar_discovered_keywords GETs the endpoint with filters", async () => {
    const get = vi.fn().mockResolvedValue({ data: { app_id: "app-1", total: 0, keywords: [] } });
    await runTool(
      toolsByName.sonar_discovered_keywords,
      { app_id: "app-1", country: "us", source: "competitor", status: "new", bucket: "gap", min_relevance: 60, min_opportunity: 40, limit: 50 },
      mockClient(get)
    );
    expect(get).toHaveBeenCalledWith("/api/v1/apps/app-1/discovered-keywords", {
      country: "us",
      source: "competitor",
      status: "new",
      bucket: "gap",
      min_relevance: 60,
      min_opportunity: 40,
      limit: 50,
    });
  });

  it("sonar_discovered_keywords rejects an invalid bucket", async () => {
    const result = await runTool(
      toolsByName.sonar_discovered_keywords,
      { app_id: "app-1", bucket: "nope" },
      mockClient(async () => {
        throw new Error("should not be called");
      })
    );
    expect(result.isError).toBe(true);
  });

  it("sonar_alert_events GETs /api/v1/alerts/events with filters", async () => {
    const get = vi.fn().mockResolvedValue({ data: [] });
    await runTool(
      toolsByName.sonar_alert_events,
      { type: "rank_drop", since: "2026-08-01T00:00:00Z", limit: 20 },
      mockClient(get)
    );
    expect(get).toHaveBeenCalledWith("/api/v1/alerts/events", {
      type: "rank_drop",
      app_id: undefined,
      since: "2026-08-01T00:00:00Z",
      limit: 20,
    });
  });

  it("sonar_review_insights GETs the endpoint with the country", async () => {
    const get = vi.fn().mockResolvedValue({ data: { insight: null } });
    await runTool(
      toolsByName.sonar_review_insights,
      { app_id: "app-1", country: "de" },
      mockClient(get)
    );
    expect(get).toHaveBeenCalledWith("/api/v1/apps/app-1/review-insights", {
      country: "de",
    });
  });

  it("sonar_generate_review_insights POSTs with the country in the query", async () => {
    const post = vi.fn().mockResolvedValue({ data: { insight: {} } });
    await runTool(
      toolsByName.sonar_generate_review_insights,
      { app_id: "app-1" },
      mockPostClient(post)
    );
    expect(post).toHaveBeenCalledWith(
      "/api/v1/apps/app-1/review-insights?country=us",
      {}
    );
  });
});

describe("phase-2 computed-insight tools (overview, portfolio)", () => {
  it("sonar_app_overview GETs the overview endpoint with days", async () => {
    const get = vi.fn().mockResolvedValue({ data: { app_id: "app-1" } });
    await runTool(
      toolsByName.sonar_app_overview,
      { app_id: "app-1", days: 14 },
      mockClient(get)
    );
    expect(get).toHaveBeenCalledWith("/api/v1/apps/app-1/overview", {
      days: 14,
    });
  });

  it("sonar_app_overview rejects an out-of-range days", async () => {
    const result = await runTool(
      toolsByName.sonar_app_overview,
      { app_id: "app-1", days: 365 },
      mockClient(async () => {
        throw new Error("should not be called");
      })
    );
    expect(result.isError).toBe(true);
  });

  it("sonar_portfolio GETs /api/v1/portfolio", async () => {
    const get = vi.fn().mockResolvedValue({ data: { kpis: {} } });
    await runTool(toolsByName.sonar_portfolio, {}, mockClient(get));
    expect(get).toHaveBeenCalledWith("/api/v1/portfolio");
  });
});

describe("App Store Connect tools (sales, engagement)", () => {
  it.each([
    ["sonar_app_sales", "sales"],
    ["sonar_app_engagement", "engagement"],
  ])("%s GETs /apps/:id/%s with the date window", async (name, path) => {
    const get = vi.fn().mockResolvedValue({ data: { status: "ready" } });
    const result = await runTool(
      toolsByName[name],
      { app_id: "app 1", start: "2026-09-01", end: "2026-09-30" },
      mockClient(get)
    );
    expect(result.isError).toBeFalsy();
    expect(get).toHaveBeenCalledWith(`/api/v1/apps/app%201/${path}`, {
      start: "2026-09-01",
      end: "2026-09-30",
      days: undefined,
      store: undefined,
    });
    expect(JSON.parse(result.content[0].text)).toEqual({ status: "ready" });
  });

  it("forwards days and the store disambiguator", async () => {
    const get = vi.fn().mockResolvedValue({ data: {} });
    await runTool(
      toolsByName.sonar_app_sales,
      { app_id: "com.example.app", days: 7, store: "ios" },
      mockClient(get)
    );
    expect(get).toHaveBeenCalledWith("/api/v1/apps/com.example.app/sales", {
      start: undefined,
      end: undefined,
      days: 7,
      store: "ios",
    });
  });

  it("passes a not-ready status through so the agent sees the message", async () => {
    const payload = {
      status: "not_connected",
      connected: false,
      message: "App Store Connect is not connected.",
      totals: null,
      days: [],
    };
    const get = vi.fn().mockResolvedValue({ data: payload });
    const result = await runTool(
      toolsByName.sonar_app_engagement,
      { app_id: "app-1" },
      mockClient(get)
    );
    expect(JSON.parse(result.content[0].text)).toEqual(payload);
  });

  it.each([
    { days: 0 },
    { days: 367 },
    { start: "09/01/2026" },
    { end: "2026-9-1" },
  ])("rejects an invalid window %o before calling the API", async (bad) => {
    const result = await runTool(
      toolsByName.sonar_app_sales,
      { app_id: "app-1", ...bad },
      mockClient(async () => {
        throw new Error("should not be called");
      })
    );
    expect(result.isError).toBe(true);
  });

  it("surfaces the Agency-plan 403 as a tool error", async () => {
    const result = await runTool(
      toolsByName.sonar_app_sales,
      { app_id: "app-1" },
      mockClient(async () => {
        throw new SonarApiError(
          403,
          "forbidden",
          "App Store Connect data via the API requires the Agency plan. Upgrade at /settings/plan."
        );
      })
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Agency plan/);
  });

  it("descriptions state Agency plan, iOS only, and the impressions definition", () => {
    for (const name of ["sonar_app_sales", "sonar_app_engagement"]) {
      expect(toolsByName[name].description).toMatch(/Agency plan/);
      expect(toolsByName[name].description).toMatch(/App Store Connect connection/);
      expect(toolsByName[name].description).toMatch(/iOS only/);
    }
    expect(toolsByName.sonar_app_engagement.description).toMatch(
      /INCLUDE product page views/
    );
  });
});

describe("sonar_keyword_metrics — partial shed", () => {
  it("folds the body retry hint into a shed term's message", async () => {
    const get = vi.fn().mockResolvedValue({
      data: [
        { keyword: "habit tracker", store: "ios", country: "us", difficulty: 42 },
        {
          keyword: "sleep sounds",
          store: "ios",
          country: "us",
          difficulty: 0,
          error: {
            code: "rate_limited",
            message: "Scraper queue is busy — retry this keyword shortly.",
            retry_after_seconds: 30,
          },
        },
      ],
    });
    const result = await runTool(
      toolsByName.sonar_keyword_metrics,
      { keywords: ["habit tracker", "sleep sounds"], store: "ios" },
      mockClient(get)
    );
    const data = JSON.parse(result.content[0].text);
    // Retry-After on a 200 is nonstandard and gets stripped by proxies, so
    // the wait travels in the body — an agent must see it in the message.
    expect(data[1].error.message).toMatch(/Retry after 30s/);
    expect(data[1].error.message).toMatch(/not charged/i);
    expect(data[1].error.retry_after_seconds).toBe(30);
    expect(data[0].error).toBeUndefined();
  });

  it("leaves served terms and hint-less errors untouched", async () => {
    const get = vi.fn().mockResolvedValue({
      data: [
        {
          keyword: "budget app",
          store: "ios",
          country: "us",
          difficulty: 0,
          error: { code: "unavailable", message: "Store data is temporarily unavailable." },
        },
      ],
    });
    const result = await runTool(
      toolsByName.sonar_keyword_metrics,
      { keywords: ["budget app"], store: "ios" },
      mockClient(get)
    );
    const data = JSON.parse(result.content[0].text);
    expect(data[0].error.message).toBe("Store data is temporarily unavailable.");
  });
});

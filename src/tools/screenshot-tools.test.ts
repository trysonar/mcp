import { describe, it, expect, vi } from "vitest";
import type { ApiClient } from "../client.js";
import { runTool, toolsByName } from "./index.js";
import { stripImageData } from "./screenshot-sets.js";

function mockClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    get: vi.fn().mockResolvedValue({ data: {} }),
    request: vi.fn().mockResolvedValue({ data: {} }),
    ...overrides,
  } as ApiClient;
}

const LAYOUT = {
  background: { color: "#0F172A" },
  layers: [
    {
      type: "text",
      id: "headline",
      x: 0,
      y: 0,
      width: 1000,
      text: "Hi",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 100,
      fontStyle: "bold",
      fill: "#ffffff",
      align: "center",
    },
  ],
};

describe("stripImageData", () => {
  it("replaces long inline data URLs with a placeholder", () => {
    const long = `data:image/png;base64,${"A".repeat(500)}`;
    const result = stripImageData({
      layers: [{ imageDataUrl: long, screenshotDataUrl: null }],
    }) as { layers: [{ imageDataUrl: string; screenshotDataUrl: null }] };

    expect(result.layers[0].imageDataUrl).toMatch(/inline image omitted/);
    expect(result.layers[0].imageDataUrl).not.toMatch(/AAAA/);
    expect(result.layers[0].screenshotDataUrl).toBeNull();
  });

  it("keeps short data URLs and normal strings intact", () => {
    const short = "data:image/png;base64,abc";
    expect(stripImageData({ a: short, b: "hello" })).toEqual({
      a: short,
      b: "hello",
    });
  });
});

describe("sonar_screenshot_layout_guide", () => {
  it("returns the embedded guide without any API call", async () => {
    const client = mockClient();
    const result = await runTool(
      toolsByName.sonar_screenshot_layout_guide,
      {},
      client
    );

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toMatch(/layout format/i);
    expect(result.content[0].text).toMatch(/device-frame/);
    expect(client.get).not.toHaveBeenCalled();
    expect(client.request).not.toHaveBeenCalled();
  });
});

describe("sonar_screenshot_devices", () => {
  it("hits the devices endpoint", async () => {
    const client = mockClient({
      get: vi.fn().mockResolvedValue({ data: [{ id: "iphone-6.7" }] }),
    });
    const result = await runTool(toolsByName.sonar_screenshot_devices, {}, client);

    expect(client.get).toHaveBeenCalledWith("/api/v1/screenshots/devices");
    expect(JSON.parse(result.content[0].text)).toEqual([{ id: "iphone-6.7" }]);
  });
});

describe("sonar_list_screenshot_sets", () => {
  it("passes product_id as a query param", async () => {
    const client = mockClient({ get: vi.fn().mockResolvedValue({ data: [] }) });
    await runTool(
      toolsByName.sonar_list_screenshot_sets,
      { product_id: "prod-1" },
      client
    );

    expect(client.get).toHaveBeenCalledWith("/api/v1/screenshots/sets", {
      product_id: "prod-1",
    });
  });

  it("rejects a missing product_id", async () => {
    const result = await runTool(
      toolsByName.sonar_list_screenshot_sets,
      {},
      mockClient()
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/product_id/);
  });
});

describe("sonar_create_screenshot_set", () => {
  it("POSTs the full body", async () => {
    const request = vi.fn().mockResolvedValue({ data: { id: "set-1" } });
    const client = mockClient({ request });
    const args = {
      product_id: "prod-1",
      store: "ios",
      device_size: "iphone-6.7",
      screens: [LAYOUT],
    };
    const result = await runTool(
      toolsByName.sonar_create_screenshot_set,
      args,
      client
    );

    expect(request).toHaveBeenCalledWith(
      "POST",
      "/api/v1/screenshots/sets",
      expect.objectContaining({
        product_id: "prod-1",
        store: "ios",
        device_size: "iphone-6.7",
        screens: [LAYOUT],
      })
    );
    expect(JSON.parse(result.content[0].text)).toEqual({ id: "set-1" });
  });

  it("rejects template_id and screens together", async () => {
    const result = await runTool(
      toolsByName.sonar_create_screenshot_set,
      {
        product_id: "prod-1",
        store: "ios",
        device_size: "iphone-6.7",
        template_id: "blank",
        screens: [LAYOUT],
      },
      mockClient()
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/not both/);
  });
});

describe("sonar_get_screenshot_set", () => {
  const longImage = `data:image/png;base64,${"B".repeat(500)}`;

  it("strips inline image data by default", async () => {
    const client = mockClient({
      get: vi.fn().mockResolvedValue({
        data: { screens: [{ layout: { layers: [{ imageDataUrl: longImage }] } }] },
      }),
    });
    const result = await runTool(
      toolsByName.sonar_get_screenshot_set,
      { set_id: "set-1" },
      client
    );

    expect(client.get).toHaveBeenCalledWith("/api/v1/screenshots/sets/set-1");
    expect(result.content[0].text).toMatch(/inline image omitted/);
    expect(result.content[0].text).not.toMatch(/BBBB/);
  });

  it("returns raw data URLs with include_image_data: true", async () => {
    const client = mockClient({
      get: vi.fn().mockResolvedValue({
        data: { screens: [{ layout: { layers: [{ imageDataUrl: longImage }] } }] },
      }),
    });
    const result = await runTool(
      toolsByName.sonar_get_screenshot_set,
      { set_id: "set-1", include_image_data: true },
      client
    );

    expect(result.content[0].text).toMatch(/BBBB/);
  });
});

describe("sonar_update_screenshot_set", () => {
  it("PATCHes only the provided fields, set_id stays in the path", async () => {
    const request = vi.fn().mockResolvedValue({ data: { id: "set-1" } });
    await runTool(
      toolsByName.sonar_update_screenshot_set,
      { set_id: "set-1", screen_order: ["b", "a"] },
      mockClient({ request })
    );

    expect(request).toHaveBeenCalledWith(
      "PATCH",
      "/api/v1/screenshots/sets/set-1",
      { screen_order: ["b", "a"] }
    );
  });

  it("rejects an update with no fields", async () => {
    const result = await runTool(
      toolsByName.sonar_update_screenshot_set,
      { set_id: "set-1" },
      mockClient()
    );
    expect(result.isError).toBe(true);
  });
});

describe("sonar_add_screenshot / sonar_update_screenshot / sonar_delete_screenshot", () => {
  it("add posts to the set's screens collection", async () => {
    const request = vi.fn().mockResolvedValue({ data: { id: "scr-1" } });
    await runTool(
      toolsByName.sonar_add_screenshot,
      { set_id: "set-1", layout: LAYOUT },
      mockClient({ request })
    );
    expect(request).toHaveBeenCalledWith(
      "POST",
      "/api/v1/screenshots/sets/set-1/screens",
      { layout: LAYOUT }
    );
  });

  it("add without layout sends an empty body", async () => {
    const request = vi.fn().mockResolvedValue({ data: { id: "scr-1" } });
    await runTool(
      toolsByName.sonar_add_screenshot,
      { set_id: "set-1" },
      mockClient({ request })
    );
    expect(request).toHaveBeenCalledWith(
      "POST",
      "/api/v1/screenshots/sets/set-1/screens",
      {}
    );
  });

  it("update PUTs the replacement layout", async () => {
    const request = vi.fn().mockResolvedValue({ data: { id: "scr-1" } });
    await runTool(
      toolsByName.sonar_update_screenshot,
      { screenshot_id: "scr-1", layout: LAYOUT },
      mockClient({ request })
    );
    expect(request).toHaveBeenCalledWith(
      "PUT",
      "/api/v1/screenshots/screens/scr-1",
      { layout: LAYOUT }
    );
  });

  it("delete hits the screen resource", async () => {
    const request = vi.fn().mockResolvedValue({ data: { deleted: true } });
    await runTool(
      toolsByName.sonar_delete_screenshot,
      { screenshot_id: "scr-1" },
      mockClient({ request })
    );
    expect(request).toHaveBeenCalledWith(
      "DELETE",
      "/api/v1/screenshots/screens/scr-1"
    );
  });
});

describe("sonar_set_screenshot_translations", () => {
  it("PUTs entries under the locale path", async () => {
    const request = vi.fn().mockResolvedValue({ data: { locale: "de-DE" } });
    await runTool(
      toolsByName.sonar_set_screenshot_translations,
      {
        set_id: "set-1",
        locale: "de-DE",
        entries: [
          { screenshot_id: "scr-1", overrides: { headline: { text: "Hallo" } } },
        ],
      },
      mockClient({ request })
    );

    expect(request).toHaveBeenCalledWith(
      "PUT",
      "/api/v1/screenshots/sets/set-1/translations/de-DE",
      {
        entries: [
          { screenshot_id: "scr-1", overrides: { headline: { text: "Hallo" } } },
        ],
      }
    );
  });

  it("rejects empty entries", async () => {
    const result = await runTool(
      toolsByName.sonar_set_screenshot_translations,
      { set_id: "set-1", locale: "de-DE", entries: [] },
      mockClient()
    );
    expect(result.isError).toBe(true);
  });
});

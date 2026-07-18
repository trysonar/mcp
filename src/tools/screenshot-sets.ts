import { z } from "zod";
import type { ApiResponse } from "../types.js";
import { readAnnotations, writeAnnotations, type ToolDefinition } from "./shared.js";

// Layout documents are validated server-side against the canonical zod
// schema; the tools pass them through as opaque objects. Agents should read
// sonar_screenshot_layout_guide before constructing one.
const layoutSchema = z
  .record(z.string(), z.unknown())
  .describe(
    "A screenshot layout document ({background, layers}) — see sonar_screenshot_layout_guide. Image fields accept https:// URLs."
  );

/**
 * Replaces inline base64 image payloads with short placeholders so a fetched
 * set doesn't flood the agent's context. The placeholder intentionally fails
 * server-side validation: a stripped layout sent back via update is rejected
 * instead of silently wiping images.
 */
function stripImageData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripImageData);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        stripImageData(v),
      ])
    );
  }
  if (
    typeof value === "string" &&
    value.startsWith("data:image/") &&
    value.length > 256
  ) {
    return `[inline image omitted, ${value.length} chars — refetch with include_image_data: true before sending this layout back]`;
  }
  return value;
}

// ---------------------------------------------------------------------------

const listInputSchema = z.object({
  product_id: z
    .string()
    .min(1)
    .describe("Product id (find it with sonar_list_products)."),
});

export const listScreenshotSetsTool: ToolDefinition<typeof listInputSchema> = {
  name: "sonar_list_screenshot_sets",
  title: "List Screenshot Sets",
  description:
    "List a product's app-store screenshot sets (metadata only: store, device size, locales, studio_url). Use sonar_get_screenshot_set for full layouts.",
  inputSchema: listInputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<unknown>>(
      "/api/v1/screenshots/sets",
      { product_id: args.product_id }
    );
    return res.data;
  },
};

const createInputSchema = z
  .object({
    product_id: z.string().min(1).describe("Product the set belongs to."),
    store: z.enum(["ios", "android"]).describe("Target app store."),
    device_size: z
      .string()
      .min(1)
      .describe('Device id from sonar_screenshot_devices, e.g. "iphone-6.7".'),
    name: z.string().min(1).max(120).optional().describe("Display name."),
    template_id: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Seed from a built-in template (see sonar_screenshot_layout_guide) instead of providing screens."
      ),
    screens: z
      .array(layoutSchema)
      .min(1)
      .max(10)
      .optional()
      .describe(
        "Initial screens, in order (max 10). Either this or template_id, not both; with neither you get one blank screen."
      ),
  })
  .refine((v) => !(v.template_id && v.screens), {
    message: "Provide either template_id or screens, not both.",
    path: ["template_id"],
  });

export const createScreenshotSetTool: ToolDefinition<typeof createInputSchema> = {
  name: "sonar_create_screenshot_set",
  title: "Create Screenshot Set",
  description:
    "Create an app-store screenshot set for a product. Read sonar_screenshot_layout_guide first, then author the screens array. The set is immediately visible/editable for humans in the Screenshot Studio (studio_url in the response). Requires a write-scope API key.",
  inputSchema: createInputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await client.request<ApiResponse<unknown>>(
      "POST",
      "/api/v1/screenshots/sets",
      args
    );
    return res.data;
  },
};

const getInputSchema = z.object({
  set_id: z.string().min(1).describe("Screenshot set id."),
  include_image_data: z
    .boolean()
    .default(false)
    .describe(
      "When false (default), inline base64 images are replaced with short placeholders to keep the response small. Set true only when you need the raw data URLs (a layout containing placeholders is rejected on update)."
    ),
});

export const getScreenshotSetTool: ToolDefinition<typeof getInputSchema> = {
  name: "sonar_get_screenshot_set",
  title: "Get Screenshot Set",
  description:
    "Fetch a screenshot set in full: every screen's layout JSON plus per-screen translation overrides keyed by locale. By default inline image data is replaced with placeholders to keep the response readable.",
  inputSchema: getInputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<unknown>>(
      `/api/v1/screenshots/sets/${encodeURIComponent(args.set_id)}`
    );
    return args.include_image_data ? res.data : stripImageData(res.data);
  },
};

const updateSetInputSchema = z
  .object({
    set_id: z.string().min(1).describe("Screenshot set id."),
    name: z.string().min(1).max(120).optional().describe("New display name."),
    locales: z
      .array(z.string().min(2).max(8))
      .max(40)
      .optional()
      .describe(
        'Replaces the extra-locale list (e.g. ["de-DE","fr-FR"]). Locales removed here lose their stored translations.'
      ),
    screen_order: z
      .array(z.string().min(1))
      .min(1)
      .optional()
      .describe(
        "Full permutation of the set's screen ids in the new display order."
      ),
  })
  .refine((v) => v.name || v.locales || v.screen_order, {
    message: "Provide at least one of name, locales, screen_order.",
    path: ["name"],
  });

export const updateScreenshotSetTool: ToolDefinition<typeof updateSetInputSchema> = {
  name: "sonar_update_screenshot_set",
  title: "Update Screenshot Set",
  description:
    "Rename a screenshot set, replace its extra-locale list, and/or reorder its screens. Returns the updated set (with image data stripped). Requires a write-scope API key.",
  inputSchema: updateSetInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  async handler(args, client) {
    const { set_id, ...body } = args;
    const res = await client.request<ApiResponse<unknown>>(
      "PATCH",
      `/api/v1/screenshots/sets/${encodeURIComponent(set_id)}`,
      body
    );
    return stripImageData(res.data);
  },
};

const deleteSetInputSchema = z.object({
  set_id: z.string().min(1).describe("Screenshot set id."),
});

export const deleteScreenshotSetTool: ToolDefinition<typeof deleteSetInputSchema> = {
  name: "sonar_delete_screenshot_set",
  title: "Delete Screenshot Set",
  description:
    "Permanently delete a screenshot set and everything in it (screens, translations). Irreversible — confirm with the user before deleting work they may want. Requires a write-scope API key.",
  inputSchema: deleteSetInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await client.request<ApiResponse<unknown>>(
      "DELETE",
      `/api/v1/screenshots/sets/${encodeURIComponent(args.set_id)}`
    );
    return res.data;
  },
};

export { stripImageData };

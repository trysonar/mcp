import { z } from "zod";
import type { ApiResponse } from "../types.js";
import { writeAnnotations, type ToolDefinition } from "./shared.js";
import { stripImageData } from "./screenshot-sets.js";

const layoutSchema = z
  .record(z.string(), z.unknown())
  .describe(
    "A screenshot layout document ({background, layers}) — see sonar_screenshot_layout_guide. Image fields accept https:// URLs."
  );

const addInputSchema = z.object({
  set_id: z.string().min(1).describe("Screenshot set to append to."),
  layout: layoutSchema.optional().describe("Omit for a blank screen."),
});

export const addScreenshotTool: ToolDefinition<typeof addInputSchema> = {
  name: "sonar_add_screenshot",
  title: "Add Screenshot",
  description:
    "Append a screen to a screenshot set (at the end; reorder with sonar_update_screenshot_set). Requires a write-scope API key.",
  inputSchema: addInputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await client.request<ApiResponse<unknown>>(
      "POST",
      `/api/v1/screenshots/sets/${encodeURIComponent(args.set_id)}/screens`,
      args.layout ? { layout: args.layout } : {}
    );
    return stripImageData(res.data);
  },
};

const updateInputSchema = z.object({
  screenshot_id: z
    .string()
    .min(1)
    .describe("Screen id (from the set's screens array)."),
  layout: layoutSchema.describe(
    "The FULL replacement layout — this replaces the whole document, it does not merge. Never send a layout containing '[inline image omitted…]' placeholders; refetch with include_image_data first."
  ),
});

export const updateScreenshotTool: ToolDefinition<typeof updateInputSchema> = {
  name: "sonar_update_screenshot",
  title: "Update Screenshot",
  description:
    "Replace one screen's layout in a screenshot set. Whole-document replace — fetch the current layout, modify it, send it back. The change shows up immediately in the Screenshot Studio for human review. Requires a write-scope API key.",
  inputSchema: updateInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await client.request<ApiResponse<unknown>>(
      "PUT",
      `/api/v1/screenshots/screens/${encodeURIComponent(args.screenshot_id)}`,
      { layout: args.layout }
    );
    return stripImageData(res.data);
  },
};

const deleteInputSchema = z.object({
  screenshot_id: z.string().min(1).describe("Screen id to delete."),
});

export const deleteScreenshotTool: ToolDefinition<typeof deleteInputSchema> = {
  name: "sonar_delete_screenshot",
  title: "Delete Screenshot",
  description:
    "Delete one screen from a screenshot set. A set keeps at least one screen — deleting the last one is rejected. Requires a write-scope API key.",
  inputSchema: deleteInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await client.request<ApiResponse<unknown>>(
      "DELETE",
      `/api/v1/screenshots/screens/${encodeURIComponent(args.screenshot_id)}`
    );
    return res.data;
  },
};

const translationsInputSchema = z.object({
  set_id: z.string().min(1).describe("Screenshot set id."),
  locale: z
    .string()
    .min(2)
    .max(8)
    .describe('Target locale code, e.g. "de-DE", "pt-BR", "zh-Hans".'),
  entries: z
    .array(
      z.object({
        screenshot_id: z.string().min(1).describe("Screen this entry localizes."),
        overrides: z
          .record(z.string(), z.unknown())
          .describe(
            'Sparse overrides keyed by layer id, e.g. {"headline": {"text": "…"}, "device": {"screenshotDataUrl": "https://…"}}. Replaces the screen\'s stored overrides for this locale wholesale.'
          ),
      })
    )
    .min(1)
    .max(50)
    .describe("One entry per screen to localize."),
});

export const setScreenshotTranslationsTool: ToolDefinition<
  typeof translationsInputSchema
> = {
  name: "sonar_set_screenshot_translations",
  title: "Set Screenshot Translations",
  description:
    "Write a locale's translation overrides for screens in a screenshot set (text copy, localized captures/images). Geometry and styling always come from the source layout; anything not overridden falls back to it. The locale is auto-enabled on the set. Requires a write-scope API key.",
  inputSchema: translationsInputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await client.request<ApiResponse<unknown>>(
      "PUT",
      `/api/v1/screenshots/sets/${encodeURIComponent(args.set_id)}/translations/${encodeURIComponent(args.locale)}`,
      { entries: args.entries }
    );
    return res.data;
  },
};

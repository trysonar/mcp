import { z } from "zod";
import type { ApiResponse, TrackKeywordsResult } from "../types.js";
import { postWrite, writeAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID — the `apps[].id` returned by sonar_create_product (or sonar_track_app). NOT a store id; the store is implied by the app."
    ),
  keywords: z
    .array(z.string().min(1).max(120))
    .min(1)
    .max(200)
    .describe(
      "Keywords to start tracking (1-200). Duplicates and already-tracked terms are reported, not duplicated."
    ),
  country: z
    .string()
    .length(2)
    .toLowerCase()
    .optional()
    .describe(
      'ISO 3166-1 alpha-2 country code (e.g. "us"). Optional — defaults to the product\'s country.'
    ),
});

export const trackKeywordsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_track_keywords",
  description:
    "WRITE tool — starts daily rank tracking for one or more keywords on an app in the caller's Sonar workspace. Idempotent: re-posting the same terms reports them as already_tracked instead of creating duplicates. Returns per-keyword outcomes (created / already_tracked / failed). Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await postWrite<ApiResponse<TrackKeywordsResult>>(
      client,
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/keywords`,
      {
        keywords: args.keywords,
        ...(args.country ? { country: args.country } : {}),
      }
    );
    return res.data;
  },
};

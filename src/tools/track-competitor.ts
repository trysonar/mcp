import { z } from "zod";
import type { ApiResponse, TrackCompetitorResult } from "../types.js";
import {
  storeSchema,
  postWrite,
  writeAnnotations,
  type ToolDefinition,
} from "./shared.js";

const inputSchema = z.object({
  product_id: z
    .string()
    .min(1)
    .describe(
      "Sonar product UUID (from sonar_create_product). NOT a store id."
    ),
  store: storeSchema,
  store_id: z
    .string()
    .min(1)
    .describe(
      "Store-specific app identifier of the COMPETITOR app to track. iOS: numeric track ID. Android: package name."
    ),
  country: z
    .string()
    .length(2)
    .toLowerCase()
    .optional()
    .describe(
      'ISO 3166-1 alpha-2 country code (e.g. "us"). Optional — defaults server-side.'
    ),
});

export const trackCompetitorTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_track_competitor",
  title: "Track Competitor",
  description:
    "WRITE tool — adds a competitor app under a Sonar product so its keywords and rankings get tracked alongside the product's own app. The product must already have its own app linked in the same store as the competitor. Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await postWrite<ApiResponse<TrackCompetitorResult>>(
      client,
      `/api/v1/products/${encodeURIComponent(args.product_id)}/competitors`,
      {
        store: args.store,
        store_id: args.store_id,
        ...(args.country ? { country: args.country } : {}),
      }
    );
    return res.data;
  },
};

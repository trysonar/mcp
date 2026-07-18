import { z } from "zod";
import type { ApiResponse, TrackAppResult } from "../types.js";
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
      "Store-specific app identifier of the version to link. iOS: numeric track ID. Android: package name."
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

export const trackAppTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_track_app",
  title: "Track App",
  description:
    "WRITE tool — links the second-store version of an existing Sonar product (e.g. the product already tracks the iOS app and you want to add the Android version, or vice versa). Each product holds at most one iOS + one Android app; to start tracking a brand-new app, use sonar_create_product instead. Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await postWrite<ApiResponse<TrackAppResult>>(
      client,
      `/api/v1/products/${encodeURIComponent(args.product_id)}/apps`,
      {
        store: args.store,
        store_id: args.store_id,
        ...(args.country ? { country: args.country } : {}),
      }
    );
    return res.data;
  },
};

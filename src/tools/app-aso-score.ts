import { z } from "zod";
import type { ApiResponse, AsoScoreResult } from "../types.js";
import { readAnnotations, storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  store: storeSchema,
  store_id: z
    .string()
    .min(1)
    .describe(
      'Store-specific app identifier. iOS: numeric track ID. Android: package name.'
    ),
  country: countrySchema,
});

export const appAsoScoreTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_aso_score",
  description:
    "Calculate an ASO (App Store Optimization) audit score (0-100) for an app. Returns the overall score plus an itemized breakdown of checks (title length, keyword usage, screenshots, ratings, etc.) so you can identify what to improve.",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<AsoScoreResult>>(
      "/api/v1/apps/aso-score",
      {
        store: args.store,
        id: args.store_id,
        country: args.country,
      }
    );
    return res.data;
  },
};

import { z } from "zod";
import type { ApiResponse, RevenueResult } from "../types.js";
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

export const appRevenueTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_revenue",
  title: "Estimate App Revenue",
  description:
    "Estimate monthly revenue for an app, based on install counts, ratings, and category benchmarks. Returns the dollar estimate, a confidence grade (high/medium/low) with the factors behind it, and the methodology used — always communicate the confidence alongside the number.",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<RevenueResult>>(
      "/api/v1/apps/revenue",
      {
        store: args.store,
        id: args.store_id,
        country: args.country,
      }
    );
    return res.data;
  },
};

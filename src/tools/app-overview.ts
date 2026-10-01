import { z } from "zod";
import type { ApiResponse, AppOverviewResult } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID of one of your own tracked apps — the `id` returned by sonar_list_apps or sonar_create_product. NOT a store id."
    ),
  days: z
    .number()
    .int()
    .min(7)
    .max(90)
    .optional()
    .describe("Rank-history window in days (7-90). Default 30."),
});

export const appOverviewTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_overview",
  title: "App Overview (Dashboard Scoreboard)",
  description:
    "The dashboard's computed scoreboard for one of your apps in a single call: visibility index and share of voice (with 7-day deltas and a daily spark), ranked / top-10 keyword counts with movement, best rank, the biggest 7-day improvements and drops, the rank-distribution trend, and the actionable opportunity list (near_page_one / top_three_push / easy_target). Read this FIRST when asked how an app is doing — it's the same numbers the dashboard renders, so you don't need to recompute anything from raw rank history. Requires an Indie plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<AppOverviewResult>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/overview`,
      { days: args.days }
    );
    return res.data;
  },
};

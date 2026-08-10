import { z } from "zod";
import type { ApiResponse } from "../types.js";
import { readAnnotations, storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  store: storeSchema,
  country: countrySchema,
  chart: z
    .enum(["free", "paid", "grossing"])
    .default("free")
    .describe('Chart type: "free", "paid" or "grossing". Default "free".'),
  category: z
    .string()
    .default("overall")
    .describe(
      'Category key, e.g. "HEALTH_AND_FITNESS" (iOS) or "HEALTH_AND_FITNESS" / "GAME" (Android). ' +
        'Use "overall" (default) for the store-wide chart.'
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe("Number of chart entries to return (1-100). Default 50."),
});

export const topChartsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_top_charts",
  title: "Top Charts",
  description:
    "Get a store top chart (free / paid / grossing, overall or by category) with day-over-day " +
    "movement: per-app rank delta, apps new to the chart, biggest movers and apps that dropped " +
    "out. Use to see what's rising in a market or category. Note: summary, movers and droppedApps " +
    "always describe the full top 100 — `limit` truncates the returned entries only. Movement is " +
    "empty on the first day a chart is requested (no previous snapshot yet). Works without an API " +
    "key (free tier, limited daily use per IP).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<unknown>>("/api/v1/charts/top", {
      store: args.store,
      country: args.country,
      chart: args.chart,
      category: args.category,
      limit: args.limit,
    });
    return res.data;
  },
};

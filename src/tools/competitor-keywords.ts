import { z } from "zod";
import type { CompetitorKeyword, PaginatedResponse } from "../types.js";
import {
  cursorSchema,
  limitSchema,
  readAnnotations,
  type ToolDefinition,
} from "./shared.js";

const inputSchema = z.object({
  competitor_app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID of the competitor — the `competitor.id` from sonar_track_competitor, or an `id` from sonar_list_apps where is_own is false. NOT a store id."
    ),
  own_app_id: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Sonar app UUID of your own app. When set, each keyword includes your current rank and a gap marker for keywords you don't rank for."
    ),
  cursor: cursorSchema,
  limit: limitSchema,
});

export const competitorKeywordsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_competitor_keywords",
  title: "Competitor Keywords",
  description:
    "Keywords a tracked competitor currently ranks for (last 7 days of SERP data), with difficulty and popularity per keyword. Pass own_app_id for gap analysis: keywords where the competitor ranks but your app doesn't are marked gap=missing. Cursor-paginated (default 50 per page). Requires a Full plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<PaginatedResponse<CompetitorKeyword>>(
      `/api/v1/competitors/${encodeURIComponent(args.competitor_app_id)}/keywords`,
      { app_id: args.own_app_id, cursor: args.cursor, limit: args.limit }
    );
    return { keywords: res.data, next_cursor: res.pagination.next_cursor };
  },
};

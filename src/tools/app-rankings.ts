import { z } from "zod";
import type { AppRankingEntry, PaginatedResponse } from "../types.js";
import {
  cursorSchema,
  limitSchema,
  readAnnotations,
  type ToolDefinition,
} from "./shared.js";

const inputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID — the `id` returned by sonar_list_apps or sonar_create_product. NOT a store id."
    ),
  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe("History window in days (1-365). Default 30."),
  keyword_id: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Restrict to one keyword — a keyword_id from sonar_app_keywords. Omit for all tracked keywords."
    ),
  cursor: cursorSchema,
  limit: limitSchema,
});

export const appRankingsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_rankings",
  description:
    "Rank history for an app's tracked keywords — daily ranks over the requested window, one history array per keyword. Use this to check how rankings moved after a metadata change or to find keywords trending up or down. Cursor-paginated over keywords (default 50 per page). Requires a Full plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<PaginatedResponse<AppRankingEntry>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/rankings`,
      {
        days: args.days,
        keyword_id: args.keyword_id,
        cursor: args.cursor,
        limit: args.limit,
      }
    );
    return { rankings: res.data, next_cursor: res.pagination.next_cursor };
  },
};

import { z } from "zod";
import type { PaginatedResponse, TrackedKeywordEntry } from "../types.js";
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
  cursor: cursorSchema,
  limit: limitSchema,
});

export const appKeywordsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_keywords",
  description:
    "List the keywords tracked for an app in the caller's Sonar workspace, with latest difficulty, popularity, results count, note, and starred_at (favorite/target marker) per keyword. Returns the tracked-keyword ids used by sonar_update_keyword_note and sonar_star_keyword, and the keyword_ids used by sonar_keyword_rankings. Cursor-paginated (default 50 per page). Requires a Full plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<PaginatedResponse<TrackedKeywordEntry>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/keywords`,
      { cursor: args.cursor, limit: args.limit }
    );
    return { keywords: res.data, next_cursor: res.pagination.next_cursor };
  },
};

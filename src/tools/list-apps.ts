import { z } from "zod";
import type { PaginatedResponse, TrackedAppSummary } from "../types.js";
import {
  cursorSchema,
  limitSchema,
  readAnnotations,
  type ToolDefinition,
} from "./shared.js";

const inputSchema = z.object({
  cursor: cursorSchema,
  limit: limitSchema,
});

export const listAppsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_list_apps",
  title: "List Tracked Apps",
  description:
    "List the apps tracked in the caller's Sonar workspace (own apps + competitors), each with its latest snapshot (rating, review count, version, installs). Returns the Sonar app UUIDs needed by sonar_get_app, sonar_app_keywords, sonar_app_rankings, and sonar_app_changes. Cursor-paginated (default 100 per page). Requires a Full plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<PaginatedResponse<TrackedAppSummary>>(
      "/api/v1/apps",
      { cursor: args.cursor, limit: args.limit }
    );
    return { apps: res.data, next_cursor: res.pagination.next_cursor };
  },
};

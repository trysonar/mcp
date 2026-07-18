import { z } from "zod";
import type { ApiResponse, UpdateKeywordNoteResult } from "../types.js";
import { patchWrite, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  tracked_keyword_id: z
    .string()
    .min(1)
    .describe(
      "Tracked-keyword UUID — the `id` (not keyword_id) returned by sonar_app_keywords or sonar_track_keywords."
    ),
  starred: z
    .boolean()
    .describe("true to star the keyword (mark as a favorite/target), false to unstar."),
});

export const starKeywordTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_star_keyword",
  title: "Star Keyword",
  description:
    "WRITE tool — stars or unstars a tracked keyword in the caller's Sonar workspace. A star marks the keyword as a favorite/target the user is actively pursuing; starred keywords carry a starred_at timestamp in sonar_app_keywords results. Idempotent: re-starring refreshes the timestamp, unstarring a non-starred keyword is a no-op. Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await patchWrite<ApiResponse<UpdateKeywordNoteResult>>(
      client,
      `/api/v1/tracked-keywords/${encodeURIComponent(args.tracked_keyword_id)}`,
      { starred: args.starred }
    );
    return res.data;
  },
};

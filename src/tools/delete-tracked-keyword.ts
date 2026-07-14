import { z } from "zod";
import type { ApiResponse, DeleteTrackedKeywordResult } from "../types.js";
import { deleteWrite, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  tracked_keyword_id: z
    .string()
    .min(1)
    .describe(
      "The tracked-keyword UUID — the `id` returned by sonar_app_keywords. NOT the keyword_id."
    ),
});

export const deleteTrackedKeywordTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_delete_tracked_keyword",
  description:
    "WRITE tool — stop tracking one keyword/app pair in the caller's Sonar workspace. Identify the pair by its tracked-keyword id (from sonar_app_keywords). Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await deleteWrite<ApiResponse<DeleteTrackedKeywordResult>>(
      client,
      `/api/v1/tracked-keywords/${encodeURIComponent(args.tracked_keyword_id)}`
    );
    return res.data;
  },
};

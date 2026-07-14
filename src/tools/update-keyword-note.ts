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
  note: z
    .string()
    .max(1000)
    .nullable()
    .describe(
      "Note text (max 1000 chars). Pass null or an empty string to clear the note."
    ),
});

export const updateKeywordNoteTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_update_keyword_note",
  description:
    "WRITE tool — sets or clears the note on a tracked keyword in the caller's Sonar workspace (e.g. why it's tracked, an optimization hypothesis, a reminder). Idempotent: re-sending the same note is a no-op. Requires a Full plan (trial counts) and an API key with the write scope.",
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
      { note: args.note }
    );
    return res.data;
  },
};

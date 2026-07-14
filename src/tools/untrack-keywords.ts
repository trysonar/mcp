import { z } from "zod";
import type { ApiResponse, UntrackKeywordsResult } from "../types.js";
import { deleteWrite, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID — the `id` returned by sonar_list_apps or sonar_create_product. NOT a store id."
    ),
  all: z
    .boolean()
    .optional()
    .describe(
      "Set true to untrack ALL keywords for the app. Mutually exclusive with `ids` — pass exactly one of `all` or `ids`."
    ),
  ids: z
    .array(z.string().min(1))
    .min(1)
    .optional()
    .describe(
      "Tracked-keyword ids to untrack (from sonar_app_keywords). Mutually exclusive with `all` — pass exactly one of `all` or `ids`."
    ),
});

export const untrackKeywordsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_untrack_keywords",
  description:
    "WRITE tool — bulk-untrack keywords for an app in the caller's Sonar workspace. Pass `all: true` to remove every tracked keyword, OR `ids: [...]` to remove specific ones (exactly one of the two). Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
  async handler(args, client) {
    const hasAll = args.all === true;
    const hasIds = Array.isArray(args.ids) && args.ids.length > 0;
    if (hasAll === hasIds) {
      throw new Error(
        "Provide exactly one of `all: true` or `ids: [...]` — not both, not neither."
      );
    }
    const res = await deleteWrite<ApiResponse<UntrackKeywordsResult>>(
      client,
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/keywords`,
      hasAll ? { all: "true" } : { ids: args.ids!.join(",") }
    );
    return res.data;
  },
};

import { z } from "zod";
import type { ApiResponse, UntrackAppResult } from "../types.js";
import { deleteWrite, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID — the `id` returned by sonar_list_apps or sonar_create_product. NOT a store id."
    ),
});

export const untrackAppTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_untrack_app",
  title: "Untrack App",
  description:
    "WRITE tool — untrack an app and its associated tracking data in the caller's Sonar workspace. Requires an Indie plan (trial counts) and an authorized Sonar account or an API key with the write scope.",
  inputSchema,
  annotations: {
    openWorldHint: false,
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await deleteWrite<ApiResponse<UntrackAppResult>>(
      client,
      `/api/v1/apps/${encodeURIComponent(args.app_id)}`
    );
    return res.data;
  },
};

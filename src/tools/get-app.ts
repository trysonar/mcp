import { z } from "zod";
import type { ApiResponse, TrackedAppDetail } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID — the `id` returned by sonar_list_apps or sonar_create_product. NOT a store id."
    ),
});

export const getAppTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_get_app",
  description:
    "Get full details for one tracked app in the caller's Sonar workspace: store metadata plus up to 90 daily snapshots of rating, review count, version, and installs. Requires a Full plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<TrackedAppDetail>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}`
    );
    return res.data;
  },
};

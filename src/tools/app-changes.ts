import { z } from "zod";
import type { ApiResponse, AppChange } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID — the `id` returned by sonar_list_apps or sonar_create_product. NOT a store id."
    ),
  type: z
    .enum(["release", "metadata", "screenshots", "price", "category"])
    .optional()
    .describe("Filter to one change type. Omit for all types."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe("Max changes to return (1-200). Default 50."),
});

export const appChangesTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_changes",
  title: "App Change History",
  description:
    "Change history for a tracked app — detected releases, metadata edits, screenshot swaps, price changes, and category moves, newest first. Useful for correlating rank movements with what the app (or a competitor) changed. Requires a Full plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<AppChange[]>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/changes`,
      { type: args.type, limit: args.limit }
    );
    return res.data;
  },
};

import { z } from "zod";
import type { ApiResponse, RemoveCompetitorResult } from "../types.js";
import { deleteWrite, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  product_id: z
    .string()
    .min(1)
    .describe(
      "Sonar product UUID — the `id` returned by sonar_list_products or sonar_create_product."
    ),
  competitor_app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID of the competitor to remove (the competitor's `id`, NOT a store id)."
    ),
});

export const removeCompetitorTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_remove_competitor",
  title: "Remove Competitor",
  description:
    "WRITE tool — remove a competitor from a product in the caller's Sonar workspace. Requires an Indie plan (trial counts) and an authorized Sonar account or an API key with the write scope.",
  inputSchema,
  annotations: {
    openWorldHint: false,
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await deleteWrite<ApiResponse<RemoveCompetitorResult>>(
      client,
      `/api/v1/products/${encodeURIComponent(
        args.product_id
      )}/competitors/${encodeURIComponent(args.competitor_app_id)}`
    );
    return res.data;
  },
};

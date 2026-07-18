import { z } from "zod";
import type { ApiResponse, DeleteProductResult } from "../types.js";
import { deleteWrite, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  product_id: z
    .string()
    .min(1)
    .describe(
      "Sonar product UUID — the `id` returned by sonar_list_products or sonar_create_product."
    ),
});

export const deleteProductTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_delete_product",
  title: "Delete Product",
  description:
    "WRITE tool — delete a product and untrack its apps in the caller's Sonar workspace. Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await deleteWrite<ApiResponse<DeleteProductResult>>(
      client,
      `/api/v1/products/${encodeURIComponent(args.product_id)}`
    );
    return res.data;
  },
};

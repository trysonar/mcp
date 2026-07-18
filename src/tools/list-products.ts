import { z } from "zod";
import type { ApiResponse, ProductSummary } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({});

export const listProductsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_list_products",
  title: "List Products",
  description:
    "List your products with their linked store versions and competitor counts. Use it to discover product/app UUIDs. Requires a Full plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(_args, client) {
    const res = await client.get<ApiResponse<ProductSummary[]>>(
      "/api/v1/products"
    );
    return res.data;
  },
};

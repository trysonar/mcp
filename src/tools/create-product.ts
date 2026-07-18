import { z } from "zod";
import type { ApiResponse, CreateProductResult } from "../types.js";
import {
  storeSchema,
  postWrite,
  writeAnnotations,
  type ToolDefinition,
} from "./shared.js";

const productAppSchema = z
  .object({
    store: storeSchema,
    store_id: z
      .string()
      .min(1)
      .describe(
        "Store-specific app identifier. iOS: numeric track ID. Android: package name."
      ),
    country: z
      .string()
      .length(2)
      .toLowerCase()
      .optional()
      .describe(
        'ISO 3166-1 alpha-2 country code (e.g. "us"). Optional — defaults server-side.'
      ),
  })
  .describe("One store version of the product.");

const inputSchema = z.object({
  apps: z
    .array(productAppSchema)
    .min(1)
    .max(2)
    .describe(
      "1-2 store versions: a single iOS or Android app, or one of each for a cross-store product."
    ),
  name: z
    .string()
    .min(1)
    .max(120)
    .optional()
    .describe("Product name. Optional — defaults to the first app's name."),
});

export const createProductTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_create_product",
  title: "Create Product",
  description:
    "WRITE tool — creates a product in the caller's Sonar workspace and starts tracking the given app(s). A product is the cross-store unit (one iOS + one Android app, or just one of either). Returns the product id and the Sonar app ids needed by sonar_track_keywords and sonar_track_competitor. Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await postWrite<ApiResponse<CreateProductResult>>(
      client,
      "/api/v1/products",
      { apps: args.apps, ...(args.name ? { name: args.name } : {}) }
    );
    return res.data;
  },
};

import { z } from "zod";
import type { ApiResponse, ExtractKeywordsResult } from "../types.js";
import { readAnnotations, storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  store: storeSchema,
  store_id: z
    .string()
    .min(1)
    .describe(
      'Store-specific app identifier. iOS: numeric track ID. Android: package name.'
    ),
  country: countrySchema,
  max: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20)
    .describe("Maximum number of keywords to extract (1-50, default 20)."),
});

export const appExtractKeywordsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_extract_keywords",
  description:
    "Extract the most likely target keywords from an app's title and description, ranked by relevance. Useful for understanding what an app (yours or a competitor) is optimizing for.",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<ExtractKeywordsResult>>(
      "/api/v1/apps/extract-keywords",
      {
        store: args.store,
        id: args.store_id,
        country: args.country,
        max: args.max,
      }
    );
    return res.data;
  },
};

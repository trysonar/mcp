import { z } from "zod";
import type { ApiResponse, KeywordSearchResult } from "../types.js";
import { readAnnotations, storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z
  .object({
    keyword: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Single keyword to fetch metrics for. Use this OR `keywords`, not both."
      ),
    keywords: z
      .array(z.string().min(1))
      .min(1)
      .max(25)
      .optional()
      .describe(
        "Bulk list of keywords to fetch metrics for (max 25). Use this OR `keyword`, not both. 1 credit per keyword."
      ),
    store: storeSchema,
    country: countrySchema,
  })
  .refine((v) => !!v.keyword !== !!v.keywords, {
    message: "Provide either `keyword` (single) or `keywords` (bulk), not both.",
    path: ["keyword"],
  });

type BulkResultItem = KeywordSearchResult & {
  error?: { code: string; message: string };
};

export const keywordMetricsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_keyword_metrics",
  title: "Keyword Metrics",
  description:
    "Difficulty + popularity for a specific keyword (or up to 25 in bulk). Use this when you already know which keywords you care about — costs 1 credit per keyword. Works without an API key for up to 5 keywords/day (free tier, per IP); an API key removes that cap. Use sonar_keyword_search instead when you want related keyword ideas alongside metrics.",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    if (args.keyword) {
      const res = await client.get<ApiResponse<KeywordSearchResult>>(
        "/api/v1/keywords/metrics",
        {
          q: args.keyword,
          store: args.store,
          country: args.country,
        }
      );
      return res.data;
    }
    const res = await client.get<ApiResponse<BulkResultItem[]>>(
      "/api/v1/keywords/metrics",
      {
        qs: args.keywords!.join(","),
        store: args.store,
        country: args.country,
      }
    );
    return res.data;
  },
};

import { z } from "zod";
import type { ApiResponse, DiscoveredKeywordsResult } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID of one of your tracked apps — the `id` returned by sonar_list_apps or sonar_create_product. NOT a store id."
    ),
  country: z
    .string()
    .length(2)
    .toLowerCase()
    .optional()
    .describe("Filter to one market (ISO country code). Omit for all markets."),
  source: z
    .enum(["autocomplete", "metadata", "serp_scan", "competitor", "apple_ads", "ai"])
    .optional()
    .describe("Filter by how the keyword was discovered. Omit for all sources."),
  status: z
    .enum(["new", "tracked", "hidden", "all"])
    .optional()
    .describe(
      'Filter by row status. Default "new" — the still-actionable suggestions; "all" includes rows already tracked or hidden.'
    ),
  bucket: z
    .enum(["ranked", "gap", "idea"])
    .optional()
    .describe(
      'Filter by classification: "ranked" = the app already ranks for it, "gap" = a competitor ranks but the app does not, "idea" = verified research suggestion with no rank evidence yet. Omit for all.'
    ),
  min_relevance: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe("Only rows with AI relevance at or above this value (0-100)."),
  min_opportunity: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe("Only rows with an opportunity score at or above this value (0-100)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .describe("Max rows to return (1-500). Default 200."),
});

export const discoveredKeywordsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_discovered_keywords",
  title: "Discovered Keywords",
  description:
    "Keywords Sonar's discovery engine surfaced for one of your tracked apps but that aren't tracked yet — ranked finds (the app already ranks, unnoticed), competitor gaps, and AI/autocomplete-sourced ideas — each with popularity, difficulty, AI relevance, and an opportunity score (0-100, best first). This is Sonar's \"what should I track next\" answer: read it, pick the winners, then track them with sonar_track_keywords. Requires an Indie plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<DiscoveredKeywordsResult>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/discovered-keywords`,
      {
        country: args.country,
        source: args.source,
        status: args.status,
        bucket: args.bucket,
        min_relevance: args.min_relevance,
        min_opportunity: args.min_opportunity,
        limit: args.limit,
      }
    );
    return res.data;
  },
};

import { z } from "zod";
import type { ApiResponse, KeywordRankingsResult } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  keyword_id: z
    .string()
    .min(1)
    .describe(
      "Sonar keyword UUID — a `keyword_id` from sonar_app_keywords or sonar_competitor_keywords. NOT the keyword text."
    ),
  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe("History window in days (1-365). Default 30."),
});

export const keywordRankingsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_keyword_rankings",
  title: "Keyword SERP History",
  description:
    "SERP history for one tracked keyword — which apps ranked in the top results on each measured day, newest first. Use this to see who competes on a keyword and how the top spots shifted over time. The keyword must be tracked in the caller's Sonar workspace. Requires a Full plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<KeywordRankingsResult>>(
      `/api/v1/keywords/${encodeURIComponent(args.keyword_id)}/rankings`,
      { days: args.days }
    );
    return res.data;
  },
};

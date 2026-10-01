import { z } from "zod";
import type { ApiResponse, ReviewInsightResult } from "../types.js";
import {
  postWrite,
  readAnnotations,
  writeAnnotations,
  type ToolDefinition,
} from "./shared.js";

const readInputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID of a tracked app — your own or a competitor (an `id` from sonar_list_apps). NOT a store id."
    ),
  country: z
    .string()
    .length(2)
    .toLowerCase()
    .default("us")
    .describe(
      'Reviews market (ISO country code). Insights are generated per country. Default "us".'
    ),
});

export const reviewInsightsTool: ToolDefinition<typeof readInputSchema> = {
  name: "sonar_review_insights",
  title: "Review Insights (AI)",
  description:
    "The latest AI review analysis for a tracked app (your own or a competitor): what users praise and complain about as named themes with frequency, verbatim quotes, and trend movement (new / persisting / growing / improving / resolved), plus overall sentiment, surfaced feature requests, and what changed vs the previous analysis. `insight` is null if none has been generated yet — use sonar_generate_review_insights. Requires an Indie plan (trial counts).",
  inputSchema: readInputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<ReviewInsightResult>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/review-insights`,
      { country: args.country }
    );
    return res.data;
  },
};

const generateInputSchema = readInputSchema;

export const generateReviewInsightsTool: ToolDefinition<typeof generateInputSchema> = {
  name: "sonar_generate_review_insights",
  title: "Generate Review Insights (AI)",
  description:
    "WRITE tool — generates a fresh AI review analysis for a tracked app from its recent reviews (praise/complaint themes, sentiment, feature requests, trend vs the previous run). At most one analysis per app+country every 90 days (429 with the next available time while in cooldown — use sonar_review_insights to read the current one); needs at least 5 recent reviews. Requires a paid (non-trial) Indie plan and an authorized Sonar account or an API key with the write scope.",
  inputSchema: generateInputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await postWrite<ApiResponse<ReviewInsightResult>>(
      client,
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/review-insights?country=${encodeURIComponent(args.country)}`,
      {}
    );
    return res.data;
  },
};

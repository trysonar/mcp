import { z } from "zod";
import type {
  ApiResponse,
  CompetitorInsightResult,
  CompetitorLandscapeResult,
} from "../types.js";
import {
  postWrite,
  readAnnotations,
  writeAnnotations,
  type ToolDefinition,
} from "./shared.js";

const readInputSchema = z.object({
  app_id: z
    .string()
    .uuid()
    .describe(
      "Sonar app UUID of YOUR OWN tracked app (an `id` from sonar_list_apps where is_own is true). NOT a store id, NOT a competitor id."
    ),
});

export const competitorLandscapeTool: ToolDefinition<typeof readInputSchema> = {
  name: "sonar_competitor_landscape",
  title: "Competitor Landscape",
  description:
    "The full competitive keyword picture for one of your own apps vs every tracked competitor, in one call: live stats (keyword gaps where competitors rank and you don't, winnable gaps, competitors climbing on your tracked keywords, keywords you lead), the top gap/threat/lead rows with metrics, and the latest AI insight if one was generated (opportunity clusters, threat narratives, strengths, posture). Read this before deciding which keywords to target next. Requires a Full plan (trial counts).",
  inputSchema: readInputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<CompetitorLandscapeResult>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/competitor-landscape`
    );
    return res.data;
  },
};

const analyzeInputSchema = z.object({
  app_id: z
    .string()
    .uuid()
    .describe(
      "Sonar app UUID of YOUR OWN tracked app to analyze. NOT a store id, NOT a competitor id."
    ),
});

export const analyzeCompetitorsTool: ToolDefinition<typeof analyzeInputSchema> = {
  name: "sonar_analyze_competitors",
  title: "Analyze Competitors (AI)",
  description:
    "WRITE tool — generates a fresh AI competitive insight for one of your own apps: clusters the keyword gaps vs your competitors into named opportunity themes (with a why-now narrative and per-keyword metrics), writes threat narratives for competitors climbing on your keywords, and diffs against the previous analysis. At most one analysis per app per 7 days (429 with the next available time while in cooldown — use sonar_competitor_landscape to read the current one). Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema: analyzeInputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await postWrite<
      ApiResponse<{ app_id: string; insight: CompetitorInsightResult }>
    >(
      client,
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/competitor-landscape`,
      {}
    );
    return res.data;
  },
};

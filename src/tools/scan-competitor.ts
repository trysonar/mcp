import { z } from "zod";
import type { ApiResponse, ScanCompetitorResult } from "../types.js";
import { postWrite, writeAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  competitor_app_id: z
    .string()
    .uuid()
    .describe(
      "Sonar app UUID of the competitor to scan — the `competitor.id` from sonar_track_competitor, or an `id` from sonar_list_apps where is_own is false. NOT a store id."
    ),
  own_app_id: z
    .string()
    .uuid()
    .describe(
      "Sonar app UUID of your own app the scan compares against. The competitor must be linked to this app."
    ),
});

export const scanCompetitorTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_scan_competitor",
  description:
    "WRITE tool — runs a keyword discovery scan on a tracked competitor: finds keywords the competitor ranks for and records both apps' ranks. Heavier than other calls (fans out scraper requests; can take ~30s+). Returns counts of keywords discovered and ranked; read the results afterwards with sonar_competitor_keywords. Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await postWrite<ApiResponse<ScanCompetitorResult>>(
      client,
      `/api/v1/competitors/${encodeURIComponent(args.competitor_app_id)}/scan`,
      { own_app_id: args.own_app_id }
    );
    return res.data;
  },
};

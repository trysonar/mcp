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
  title: "Scan Competitor Keywords",
  description:
    "WRITE tool — runs an AI keyword discovery scan on a tracked competitor: generates the search terms the competitor's listing is optimized for (brand terms included), queues them for SERP verification, and verifies the first batch inline (~30s), recording both apps' ranks. Returns generated/queued/verified_now counts; the rest verify in the background over the following hours — read results with sonar_competitor_keywords. Requires a Full plan (trial counts) and an API key with the write scope.",
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

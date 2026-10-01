import { z } from "zod";
import type { AlertEvent, ApiResponse } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  type: z
    .enum([
      "rank_drop",
      "rank_gain",
      "entered_top10",
      "left_top10",
      "new_ranking",
      "rating_drop",
      "review_spike",
      "competitor_change",
      "top_chart",
    ])
    .optional()
    .describe("Filter to one alert type. Omit for all types."),
  app_id: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Filter to events about one tracked app (Sonar app UUID or store id)."
    ),
  since: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Only events created at/after this ISO 8601 timestamp (e.g. "2026-08-01T00:00:00Z"). Use your last poll time to fetch only new events.'
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe("Max events to return (1-200). Default 50."),
});

export const alertEventsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_alert_events",
  title: "Alert Events Feed",
  description:
    "The detected alert events for your workspace, newest first — the same feed as the in-app Recent Alerts panel and the email digest: rank drops/gains, top-10 entries/exits, new rankings, rating drops, review spikes, and competitor changes, each with a type-specific payload (app/keyword names, old vs new values). Events only exist for alert types you've enabled rules for (sonar_set_alert); detection runs once daily. Poll with `since` to react to changes programmatically. Requires an Indie plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<AlertEvent[]>>(
      "/api/v1/alerts/events",
      {
        type: args.type,
        app_id: args.app_id,
        since: args.since,
        limit: args.limit,
      }
    );
    return res.data;
  },
};

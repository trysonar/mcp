import { z } from "zod";
import type { AlertRule, ApiResponse } from "../types.js";
import { postWrite, writeAnnotations, type ToolDefinition } from "./shared.js";

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
    .describe(
      "The alert type to subscribe to. top_chart = one of your own apps entered or left a store top chart (overall + its category, free/paid/grossing)."
    ),
  scope_app_id: z
    .string()
    .min(1)
    .nullable()
    .optional()
    .describe(
      "Limit the alert to a single app (Sonar app UUID). Omit or null for an org-wide rule covering all tracked apps."
    ),
  threshold: z
    .number()
    .nullable()
    .optional()
    .describe(
      "Sensitivity threshold (meaning depends on type; for top_chart it's the rank cutoff, 1-200, default 200). Omit or null to use the per-type default."
    ),
  countries: z
    .array(z.string().length(2))
    .max(10)
    .nullable()
    .optional()
    .describe(
      "top_chart only: storefronts to watch (ISO 3166-1 alpha-2, e.g. [\"us\", \"de\"]), max 10. Omit to keep the stored list; null or [] = the countries you track keywords in."
    ),
  enabled: z
    .boolean()
    .optional()
    .describe("Whether the rule is active. Defaults to enabled when omitted."),
});

export const setAlertTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_set_alert",
  title: "Set Alert Rule",
  description:
    "WRITE tool — create or update an alert subscription in the caller's Sonar workspace. Upserts on (type + scope): re-submitting the same type/scope updates the existing rule. Omit `threshold` for the per-type default; omit `scope_app_id` for an org-wide rule. Requires an Indie plan (trial counts) and an authorized Sonar account or an API key with the write scope.",
  inputSchema,
  annotations: writeAnnotations,
  async handler(args, client) {
    const res = await postWrite<ApiResponse<AlertRule>>(
      client,
      "/api/v1/alerts",
      {
        type: args.type,
        ...(args.scope_app_id !== undefined
          ? { scope_app_id: args.scope_app_id }
          : {}),
        ...(args.threshold !== undefined ? { threshold: args.threshold } : {}),
        ...(args.countries !== undefined ? { countries: args.countries } : {}),
        ...(args.enabled !== undefined ? { enabled: args.enabled } : {}),
      }
    );
    return res.data;
  },
};

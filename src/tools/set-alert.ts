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
    ])
    .describe("The alert type to subscribe to."),
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
      "Sensitivity threshold (meaning depends on type). Omit or null to use the per-type default."
    ),
  enabled: z
    .boolean()
    .optional()
    .describe("Whether the rule is active. Defaults to enabled when omitted."),
});

export const setAlertTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_set_alert",
  description:
    "WRITE tool — create or update an alert subscription in the caller's Sonar workspace. Upserts on (type + scope): re-submitting the same type/scope updates the existing rule. Omit `threshold` for the per-type default; omit `scope_app_id` for an org-wide rule. Requires a Full plan (trial counts) and an API key with the write scope.",
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
        ...(args.enabled !== undefined ? { enabled: args.enabled } : {}),
      }
    );
    return res.data;
  },
};

import { z } from "zod";
import type { AlertRule, ApiResponse } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({});

export const listAlertsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_list_alerts",
  description:
    "List your alert subscriptions — each rule defines a change type (rank drops, review spikes, etc.), its scope (a specific app or org-wide), threshold, and whether it's enabled. Requires a Full plan (trial counts).",
  inputSchema,
  annotations: readAnnotations,
  async handler(_args, client) {
    const res = await client.get<ApiResponse<AlertRule[]>>("/api/v1/alerts");
    return res.data;
  },
};

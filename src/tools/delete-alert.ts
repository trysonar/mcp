import { z } from "zod";
import type { ApiResponse, DeleteAlertResult } from "../types.js";
import { deleteWrite, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe("The alert subscription UUID — the `id` returned by sonar_list_alerts or sonar_set_alert."),
});

export const deleteAlertTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_delete_alert",
  title: "Delete Alert Rule",
  description:
    "WRITE tool — delete an alert subscription in the caller's Sonar workspace. Requires a Full plan (trial counts) and an API key with the write scope.",
  inputSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
  },
  async handler(args, client) {
    const res = await deleteWrite<ApiResponse<DeleteAlertResult>>(
      client,
      `/api/v1/alerts/${encodeURIComponent(args.id)}`
    );
    return res.data;
  },
};

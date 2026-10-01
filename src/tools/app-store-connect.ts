import { z } from "zod";
import type {
  ApiResponse,
  AppEngagementResult,
  AppSalesResult,
} from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const inputSchema = z.object({
  app_id: z
    .string()
    .min(1)
    .describe(
      "Sonar app UUID of one of your own tracked iOS apps — the `id` returned by sonar_list_apps or sonar_create_product. The app's store id (bundle id) also works; pass `store` if it exists in both stores."
    ),
  store: z
    .enum(["ios", "android"])
    .optional()
    .describe(
      "Only needed when `app_id` is a store id tracked in both stores. App Store Connect data is iOS-only."
    ),
  start: isoDate
    .optional()
    .describe(
      "First day of the window (YYYY-MM-DD, inclusive). Omit to count `days` back from `end`."
    ),
  end: isoDate
    .optional()
    .describe(
      "Last day of the window (YYYY-MM-DD, inclusive). Default yesterday (UTC) — Apple posts a day the next morning at the earliest."
    ),
  days: z
    .number()
    .int()
    .min(1)
    .max(366)
    .optional()
    .describe(
      "Window length in days (1-366) when `start` is omitted. Default 30."
    ),
});

type Input = z.infer<typeof inputSchema>;

function windowParams(args: Input) {
  return { start: args.start, end: args.end, days: args.days, store: args.store };
}

const STATUS_NOTE =
  "Always check `status`: anything other than `ready` (not_connected, not_ios, app_not_in_account, pending, key_lacks_analytics) means there's no data and `message` says how to fix it — never read an empty series as zero. Days Apple hasn't reported yet have `reported: false` and null metrics.";

export const appSalesTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_sales",
  title: "App Sales (App Store Connect)",
  description:
    "App Store Connect sales for one of your own iOS apps: daily first-time downloads, redownloads, in-app purchase units and approximate USD proceeds (`proceeds_usd_approx`, converted with a static FX table — present it as approximate), window totals, and a per-country breakdown sorted by downloads. Same numbers as the Performance page. iOS only. Requires the Agency plan (403 on other plans) AND an App Store Connect connection at /settings/connections. " +
    STATUS_NOTE,
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<AppSalesResult>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/sales`,
      windowParams(args)
    );
    return res.data;
  },
};

export const appEngagementTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_engagement",
  title: "App Engagement (App Store Connect)",
  description:
    "App Store Connect App Analytics for one of your own iOS apps: the impressions → product page views → downloads funnel with conversion rates (`page_view_rate`, `download_rate`) and App Store search share, impressions by source (App Store search, browse, app referrer, web referrer…), plus daily installs, deletions and sessions. Impressions follow App Store Connect's definition and INCLUDE product page views, so totals reconcile with ASC. Downloads come from the Sales report. Same numbers as the Engagement page. iOS only. Requires the Agency plan (403 on other plans) AND an App Store Connect connection with an Admin-role key (`key_lacks_analytics` otherwise); Apple delivers the first analytics 24-48 hours after connecting (`pending`). " +
    STATUS_NOTE,
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<AppEngagementResult>>(
      `/api/v1/apps/${encodeURIComponent(args.app_id)}/engagement`,
      windowParams(args)
    );
    return res.data;
  },
};

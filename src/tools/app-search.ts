import { z } from "zod";
import type { ApiResponse, AppLookup } from "../types.js";
import { readAnnotations, storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe("Search query (e.g. \"meditation\", \"meal planner\")."),
  store: storeSchema,
  country: countrySchema,
  num: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("Number of results to return (1-50, default 10)."),
});

export const appSearchTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_search",
  title: "Search Apps",
  description:
    "Search apps in the App Store or Google Play by keyword. Returns ranked list of apps with metadata (results are returned in store ranking order). Works without an API key (free tier, limited daily use per IP).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<AppLookup[]>>("/api/v1/apps/search", {
      q: args.query,
      store: args.store,
      country: args.country,
      num: args.num,
    });
    return res.data;
  },
};

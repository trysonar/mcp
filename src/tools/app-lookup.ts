import { z } from "zod";
import type { ApiResponse, AppLookup } from "../types.js";
import { readAnnotations, storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  store: storeSchema,
  store_id: z
    .string()
    .min(1)
    .describe(
      'Store-specific app identifier. iOS: numeric track ID (e.g. "123456789"). Android: package name (e.g. "com.spotify.music").'
    ),
  country: countrySchema,
});

export const appLookupTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_lookup",
  title: "Look Up App",
  description:
    "Look up a single app by its store ID. Returns app metadata including name, developer, category, rating, reviews, installs (Android), and price. Works without an API key (free tier, limited daily use per IP).",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<AppLookup>>("/api/v1/apps/lookup", {
      store: args.store,
      id: args.store_id,
      country: args.country,
    });
    return res.data;
  },
};

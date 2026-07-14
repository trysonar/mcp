import { z } from "zod";
import type { ApiResponse, KeywordSuggestion } from "../types.js";
import { storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  seed: z
    .string()
    .min(1)
    .describe("Seed keyword. The store will return autocomplete suggestions starting from this term."),
  store: storeSchema,
  country: countrySchema,
});

export const keywordSuggestionsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_keyword_suggestions",
  description:
    "Get autocomplete suggestions for a seed keyword from the App Store or Google Play. Returns terms with a priority score (higher = more searched). Lighter and faster than sonar_keyword_search — use when you only need term ideas without difficulty/popularity scoring.",
  inputSchema,
  async handler(args, client) {
    const res = await client.get<ApiResponse<KeywordSuggestion[]>>(
      "/api/v1/keywords/suggestions",
      {
        q: args.seed,
        store: args.store,
        country: args.country,
      }
    );
    return res.data;
  },
};

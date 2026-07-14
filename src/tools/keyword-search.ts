import { z } from "zod";
import type { ApiResponse, KeywordSearchResult } from "../types.js";
import { storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe("Seed keyword to research (e.g. \"meditation\", \"recipe app\")."),
  store: storeSchema,
  country: countrySchema,
});

export const keywordSearchTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_keyword_search",
  description:
    "Research a keyword and related terms. Returns difficulty (0-100), popularity score, and results count for the seed keyword plus related autocomplete suggestions. Use this to find keywords worth targeting.",
  inputSchema,
  async handler(args, client) {
    const res = await client.get<ApiResponse<KeywordSearchResult[]>>(
      "/api/v1/keywords/search",
      {
        q: args.query,
        store: args.store,
        country: args.country,
      }
    );
    return res.data;
  },
};

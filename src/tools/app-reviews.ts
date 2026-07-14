import { z } from "zod";
import type { ApiResponse, Review } from "../types.js";
import { readAnnotations, storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({
  store: storeSchema,
  store_id: z
    .string()
    .min(1)
    .describe(
      'Store-specific app identifier. iOS: numeric track ID. Android: package name.'
    ),
  country: countrySchema,
  sort: z
    .enum(["recent", "helpful"])
    .default("recent")
    .describe('Sort order. "recent" returns newest first, "helpful" returns most-voted first.'),
  min_rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe("Filter to reviews with a star rating >= this value (1-5)."),
  max_rating: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe("Filter to reviews with a star rating <= this value (1-5)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe("Maximum number of reviews to return (1-200)."),
});

export const appReviewsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_app_reviews",
  description:
    "Fetch user reviews for an app. Supports filtering by star rating range and sorting by recent or helpful. Useful for sentiment analysis, feature-request mining, and competitive research.",
  inputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const res = await client.get<ApiResponse<Review[]>>("/api/v1/apps/reviews", {
      store: args.store,
      id: args.store_id,
      country: args.country,
      sort: args.sort,
      min_rating: args.min_rating,
      max_rating: args.max_rating,
      limit: args.limit,
    });
    return res.data;
  },
};

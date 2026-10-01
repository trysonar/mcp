import { z } from "zod";
import type { ApiResponse, KeywordSearchResult } from "../types.js";
import { publicReadAnnotations, storeSchema, countrySchema, type ToolDefinition } from "./shared.js";

const inputSchema = z
  .object({
    keyword: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Single keyword to fetch metrics for. Use this OR `keywords`, not both."
      ),
    keywords: z
      .array(z.string().min(1))
      .min(1)
      .max(25)
      .optional()
      .describe(
        "Bulk list of keywords to fetch metrics for (max 25). Use this OR `keyword`, not both. 1 credit per keyword."
      ),
    store: storeSchema,
    country: countrySchema,
  })
  .refine((v) => !!v.keyword !== !!v.keywords, {
    message: "Provide either `keyword` (single) or `keywords` (bulk), not both.",
    path: ["keyword"],
  });

type BulkResultItem = KeywordSearchResult & {
  error?: {
    code: string;
    message: string;
    /** Seconds to wait before retrying this term (scraper-queue sheds / fleet queue). */
    retry_after_seconds?: number;
  };
};

/**
 * `pending` = the API queued the term on its scrape fleet instead of failing
 * it. The tool waits and re-requests only those terms a couple of times so
 * the agent usually sees values in one call; whatever is still pending after
 * that is returned as-is with the retry hint (and was not charged).
 */
const PENDING_POLLS = 2;
const PENDING_MAX_WAIT_MS = 8_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Client = Parameters<ToolDefinition<typeof inputSchema>["handler"]>[1];

/** `single` = the API's flat `q=` shape; `bulk` = the `qs=` array, even for one term. */
async function fetchBulk(
  client: Client,
  mode: "single" | "bulk",
  keywords: string[],
  store: string,
  country: string
): Promise<BulkResultItem[]> {
  if (mode === "single") {
    const res = await client.get<ApiResponse<BulkResultItem>>("/api/v1/keywords/metrics", {
      q: keywords[0],
      store,
      country,
    });
    return [res.data];
  }
  const res = await client.get<ApiResponse<BulkResultItem[]>>("/api/v1/keywords/metrics", {
    qs: keywords.join(","),
    store,
    country,
  });
  return res.data;
}

async function fetchWithPendingPolls(
  client: Client,
  mode: "single" | "bulk",
  keywords: string[],
  store: string,
  country: string
): Promise<BulkResultItem[]> {
  let items = await fetchBulk(client, mode, keywords, store, country);
  for (let round = 0; round < PENDING_POLLS; round++) {
    const pending = items.filter((i) => i?.error?.code === "pending" && typeof i.keyword === "string");
    if (pending.length === 0) break;
    const hint = Math.min(...pending.map((p) => (p.error?.retry_after_seconds ?? 10) * 1000));
    await sleep(Math.min(PENDING_MAX_WAIT_MS, Math.max(2_000, hint)));
    const refreshed = await fetchBulk(client, mode, pending.map((p) => p.keyword), store, country);
    const byKeyword = new Map(
      refreshed
        .filter((r) => typeof r?.keyword === "string")
        .map((r) => [r.keyword.toLowerCase(), r] as const)
    );
    // Patch the pending slots in place; served items and order are untouched.
    items = items.map((item) =>
      item?.error?.code === "pending" && typeof item.keyword === "string"
        ? byKeyword.get(item.keyword.toLowerCase()) ?? item
        : item
    );
  }
  return items;
}

export const keywordMetricsTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_keyword_metrics",
  title: "Keyword Metrics",
  description:
    "Difficulty + popularity for a specific keyword (or up to 25 in bulk). Use this when you already know which keywords you care about — costs 1 credit per keyword. Works without an API key for up to 5 keywords/day (free tier, per IP); an API key removes that cap. Use sonar_keyword_search instead when you want related keyword ideas alongside metrics. A keyword the API cannot compute right away comes back as `pending` (queued on the scrape fleet, not charged) — this tool already waits and re-checks briefly; if it is still pending, call again after `retry_after_seconds`.",
  inputSchema,
  authentication: "optional",
  annotations: publicReadAnnotations,
  async handler(args, client) {
    const keywords = args.keyword ? [args.keyword] : args.keywords!;
    const items = await fetchWithPendingPolls(
      client,
      args.keyword ? "single" : "bulk",
      keywords,
      args.store,
      args.country
    );
    // Fold the body's retry hint into per-term error messages so an agent
    // reading the item backs off at the drain rate (those terms are not charged).
    const decorated = items.map((item) => {
      const seconds = item.error?.retry_after_seconds;
      if (!item.error || !seconds || /retry after \d/i.test(item.error.message)) {
        return item;
      }
      return {
        ...item,
        error: {
          ...item.error,
          message: `${item.error.message} Retry after ${seconds}s. This keyword was not charged.`,
        },
      };
    });
    return args.keyword ? decorated[0] : decorated;
  },
};

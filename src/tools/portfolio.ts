import { z } from "zod";
import type { ApiResponse, PortfolioResult } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

const inputSchema = z.object({});

export const portfolioTool: ToolDefinition<typeof inputSchema> = {
  name: "sonar_portfolio",
  title: "Portfolio Rollup (Agency)",
  description:
    "The whole portfolio's health in one call — for orgs managing many apps: per-app KPIs (visibility + 7-day delta, ranked/top-10 counts, net rank movement, rating, review count), org-wide totals, the biggest keyword movers in both directions, a needs-attention triage list (visibility drops, rating drops, not-ranked apps), and the best discovered-keyword opportunities across all apps. Same numbers as the /portfolio page. Requires an Agency plan (403 on other plans).",
  inputSchema,
  annotations: readAnnotations,
  async handler(_args, client) {
    const res = await client.get<ApiResponse<PortfolioResult>>(
      "/api/v1/portfolio"
    );
    return res.data;
  },
};

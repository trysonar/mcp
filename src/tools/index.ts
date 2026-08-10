import { appLookupTool } from "./app-lookup.js";
import { appSearchTool } from "./app-search.js";
import { appAsoScoreTool } from "./app-aso-score.js";
import { appExtractKeywordsTool } from "./app-extract-keywords.js";
import { appReviewsTool } from "./app-reviews.js";
import { appRevenueTool } from "./app-revenue.js";
import { keywordSearchTool } from "./keyword-search.js";
import { keywordMetricsTool } from "./keyword-metrics.js";
import { keywordSuggestionsTool } from "./keyword-suggestions.js";
import { topChartsTool } from "./top-charts.js";
import { listAppsTool } from "./list-apps.js";
import { getAppTool } from "./get-app.js";
import { appKeywordsTool } from "./app-keywords.js";
import { appRankingsTool } from "./app-rankings.js";
import { appChangesTool } from "./app-changes.js";
import { keywordRankingsTool } from "./keyword-rankings.js";
import { competitorKeywordsTool } from "./competitor-keywords.js";
import {
  analyzeCompetitorsTool,
  competitorLandscapeTool,
} from "./competitor-landscape.js";
import { listProductsTool } from "./list-products.js";
import { listAlertsTool } from "./list-alerts.js";
import { createProductTool } from "./create-product.js";
import { trackAppTool } from "./track-app.js";
import { trackCompetitorTool } from "./track-competitor.js";
import { trackKeywordsTool } from "./track-keywords.js";
import { updateKeywordNoteTool } from "./update-keyword-note.js";
import { starKeywordTool } from "./star-keyword.js";
import { scanCompetitorTool } from "./scan-competitor.js";
import { deleteTrackedKeywordTool } from "./delete-tracked-keyword.js";
import { untrackKeywordsTool } from "./untrack-keywords.js";
import { untrackAppTool } from "./untrack-app.js";
import { deleteProductTool } from "./delete-product.js";
import { removeCompetitorTool } from "./remove-competitor.js";
import { setAlertTool } from "./set-alert.js";
import { deleteAlertTool } from "./delete-alert.js";
import {
  screenshotDevicesTool,
  screenshotLayoutGuideTool,
} from "./screenshot-guide.js";
import {
  createScreenshotSetTool,
  deleteScreenshotSetTool,
  getScreenshotSetTool,
  listScreenshotSetsTool,
  updateScreenshotSetTool,
} from "./screenshot-sets.js";
import {
  addScreenshotTool,
  deleteScreenshotTool,
  setScreenshotTranslationsTool,
  updateScreenshotTool,
} from "./screenshot-screens.js";
import { exportScreenshotsTool } from "./screenshot-export.js";
import type { Tool } from "./shared.js";

export const tools: Tool[] = [
  // Read tools — stateless lookups, work on every plan with credits.
  appLookupTool,
  appSearchTool,
  appAsoScoreTool,
  appExtractKeywordsTool,
  appReviewsTool,
  appRevenueTool,
  keywordSearchTool,
  keywordMetricsTool,
  keywordSuggestionsTool,
  topChartsTool,
  // Read tools — org-scoped (the caller's tracked apps/keywords/competitors).
  // Server enforces Full plan; read scope is enough.
  listAppsTool,
  getAppTool,
  appKeywordsTool,
  appRankingsTool,
  appChangesTool,
  keywordRankingsTool,
  competitorKeywordsTool,
  competitorLandscapeTool,
  listProductsTool,
  listAlertsTool,
  // Write tools — mutate the caller's workspace. The server enforces
  // Full plan + write-scope key; see postWrite/patchWrite/deleteWrite in shared.ts.
  createProductTool,
  trackAppTool,
  trackCompetitorTool,
  trackKeywordsTool,
  updateKeywordNoteTool,
  starKeywordTool,
  scanCompetitorTool,
  analyzeCompetitorsTool,
  deleteTrackedKeywordTool,
  untrackKeywordsTool,
  untrackAppTool,
  deleteProductTool,
  removeCompetitorTool,
  setAlertTool,
  deleteAlertTool,
  // Screenshot Studio (Full plan; mutations need a write-scope key)
  screenshotLayoutGuideTool,
  screenshotDevicesTool,
  listScreenshotSetsTool,
  createScreenshotSetTool,
  getScreenshotSetTool,
  updateScreenshotSetTool,
  deleteScreenshotSetTool,
  addScreenshotTool,
  updateScreenshotTool,
  deleteScreenshotTool,
  setScreenshotTranslationsTool,
  exportScreenshotsTool,
];

export const toolsByName: Record<string, Tool> = Object.fromEntries(
  tools.map((t) => [t.name, t])
);

export { runTool } from "./shared.js";

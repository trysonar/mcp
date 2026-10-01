export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export type Store = "ios" | "android";

export interface AppLookup {
  store: Store;
  storeId: string;
  name: string;
  description: string;
  developer: string | null;
  category: string | null;
  iconUrl: string | null;
  rating?: number | null;
  reviews?: number | null;
  installs?: number | null;
  price?: number | null;
}

export interface AsoScoreResult {
  app: { store: Store; store_id: string; name: string; icon_url: string | null };
  score: number;
  checks: Array<{
    id: string;
    label: string;
    score: number;
    weight: number;
    detail?: string;
  }>;
}

export interface ExtractedKeyword {
  term: string;
  score: number;
}

export interface ExtractKeywordsResult {
  app: { store: Store; store_id: string; name: string; icon_url: string | null };
  keywords: ExtractedKeyword[];
}

export interface Review {
  id: string;
  author: string | null;
  title: string | null;
  body: string;
  score: number;
  version: string | null;
  date: string;
}

/**
 * Explainable ingredients behind the difficulty score — the raw SERP signals
 * (title targeting + top-3 app strength). `beatable: true` means a top-3 slot
 * looks winnable: an app holds it with ≥10x less strength than the SERP
 * median, or the term is under-targeted (≤3 title matches) with a weak top-3.
 */
export interface DifficultyBreakdown {
  titleMatches: number;
  appsAnalyzed: number;
  /** Ratings count (iOS) / installs (Android) of the top 3 apps, rank order. */
  top3Strength: number[];
  medianStrength: number;
  weakSpotRank: number | null;
  beatable: boolean;
}

export interface KeywordSearchResult {
  keyword: string;
  store: Store;
  country: string;
  difficulty: number;
  popularity: number | null;
  /**
   * Sonar's proxy estimate, present only when Apple censors the real SP to its
   * floor (5) for an iOS keyword — the value the dashboard shows in brackets,
   * e.g. popularity 5 with popularity_proxy 58. Null otherwise.
   */
  popularity_proxy?: number | null;
  /**
   * Estimated downloads/day for the app ranking #1 on this keyword (rough
   * order of magnitude from the Apple-calibrated popularity curve). iOS only;
   * null on Android or when popularity is unknown.
   */
  est_downloads_at_1?: number | null;
  /** Null for rows cached before the breakdown existed or thin SERPs. */
  difficulty_breakdown?: DifficultyBreakdown | null;
  results_count: number | null;
  /**
   * True when the API served a stored row past its 7-day warm window (up to
   * 30 days, refreshed in the background) or fell back to an older
   * measurement because the store could not be reached. Real data, billed
   * like a cache hit — a `stale: true` row beats a 429.
   */
  stale?: boolean;
}

export interface KeywordSuggestion {
  term: string;
  priority: number;
}

export interface RevenueResult {
  app: {
    store: Store;
    store_id: string;
    name: string;
    icon_url: string | null;
  } | null;
  revenue: {
    monthly: number;
    monthly_formatted: string;
    model: string;
    methodology: string;
    confidence: "high" | "medium" | "low";
    confidence_factors: string[];
  } | null;
}

// ── Write endpoint results ──────────────────────────────────────────────────

export interface LinkedApp {
  id: string;
  store: Store;
  store_id: string;
  name: string;
  developer: string | null;
  category: string | null;
  icon_url: string | null;
}

export interface CreateProductResult {
  id: string;
  name: string;
  icon_url: string | null;
  country: string;
  apps: LinkedApp[];
}

export interface TrackAppResult {
  product_id: string;
  app: LinkedApp;
}

export interface TrackCompetitorResult {
  product_id: string;
  parent_app_id: string;
  competitor: LinkedApp;
}

export interface TrackKeywordsResult {
  added: number;
  already_tracked: number;
  failed: Array<{ term: string; error: string }>;
  results: Array<{
    term: string;
    status: "created" | "already_tracked" | "failed";
    trackedKeywordId?: string;
    error?: string;
  }>;
}

export interface UpdateKeywordNoteResult {
  id: string;
  keyword_id: string;
  app_id: string;
  note: string | null;
  starred_at: string | null;
}

export interface ScanCompetitorResult {
  competitor_app_id: string;
  own_app_id: string;
  /** Candidate terms generated from the competitor's listing. */
  generated: number;
  /** Candidates queued for background SERP verification. */
  queued: number;
  /** Candidates verified inline before the response returned. */
  verified_now: number;
}

export interface LandscapeKeywordResult {
  keyword_id: string;
  keyword: string;
  country: string;
  own_rank: number | null;
  best_competitor: { app_id?: string; name: string; rank: number } | null;
  popularity: number | null;
  popularity_proxy?: number | null;
  difficulty: number | null;
  opportunity: number | null;
  tracked?: boolean;
}

export interface CompetitorInsightResult {
  generated_at: string;
  keywords_compared: number;
  competitors_analyzed: number;
  gaps_found: number;
  model: string | null;
  posture: "leader" | "challenger" | "niche" | "behind";
  overview: string;
  opportunities: {
    title: string;
    detail: string;
    priority: "high" | "medium" | "low";
    keywords: LandscapeKeywordResult[];
  }[];
  threats: { competitor_name: string; headline: string; detail: string }[];
  strengths: string[];
  changes_since_last: string | null;
}

export interface CompetitorLandscapeResult {
  app_id: string;
  stats: {
    competitors: number;
    keywords_compared: number;
    gaps: number;
    winnable: number;
    threats: number;
    leads: number;
  };
  gaps: LandscapeKeywordResult[];
  threats: {
    competitor_app_id: string;
    competitor_name: string;
    keyword_id: string;
    keyword: string;
    country: string;
    from_rank: number | null;
    to_rank: number;
    own_rank: number | null;
  }[];
  leads: LandscapeKeywordResult[];
  competitors: { app_id: string; name: string }[];
  insight: CompetitorInsightResult | null;
  insight_cooldown: { in_cooldown: boolean; next_available_at: string | null };
}

// ── Org-scoped read endpoint results ────────────────────────────────────────

export interface AppSnapshot {
  rating: number | null;
  review_count: number | null;
  version: string | null;
  installs: number | null;
  measured_at: string;
}

export interface TrackedAppSummary {
  id: string;
  store: Store;
  store_id: string;
  name: string;
  developer: string | null;
  category: string | null;
  icon_url: string | null;
  is_own: boolean;
  added_at: string;
  latest_snapshot: AppSnapshot | null;
}

export interface TrackedAppDetail extends Omit<TrackedAppSummary, "latest_snapshot"> {
  metadata: unknown;
  last_scraped_at: string | null;
  snapshots: AppSnapshot[];
}

export interface TrackedKeywordEntry {
  id: string;
  keyword_id: string;
  keyword: string;
  store: Store;
  country: string;
  added_at: string;
  note: string | null;
  starred_at: string | null;
  difficulty: number | null;
  popularity: number | null;
  /** Proxy estimate shown when the Apple SP is censored to its floor (5). */
  popularity_proxy?: number | null;
  results_count: number | null;
}

export interface AppRankingEntry {
  keyword_id: string;
  keyword: string;
  history: Array<{ rank: number; measured_at: string }>;
  /** Completed checks and unknown gaps; history remains positive ranks for compatibility. */
  observations?: Array<{
    measured_at: string;
    rank: number | null;
    status: "ranked" | "not_found" | "not_observed";
    results_count: number | null;
  }>;
}

export interface AppChange {
  id: string;
  change_type: "release" | "metadata" | "screenshots" | "price" | "category";
  detected_at: string;
  data: unknown;
}

export interface KeywordRankingsResult {
  keyword_id: string;
  keyword: string;
  store: Store;
  country: string;
  entries: Array<{
    rank: number;
    store_id: string;
    app_name: string | null;
    app_icon_url: string | null;
    measured_at: string;
  }>;
}

export interface ProductSummary {
  id: string;
  name: string;
  icon_url: string | null;
  country: string;
  created_at: string;
  competitor_count: number;
  apps: Array<{
    id: string;
    store: Store;
    store_id: string;
    name: string;
    icon_url: string | null;
  }>;
}

export type AlertType =
  | "rank_drop"
  | "rank_gain"
  | "entered_top10"
  | "left_top10"
  | "new_ranking"
  | "rating_drop"
  | "review_spike"
  | "competitor_change"
  | "top_chart";

export interface AlertRule {
  id: string;
  type: AlertType;
  scope_app_id: string | null;
  threshold: number | null;
  effective_threshold: number | null;
  /** top_chart only; null = the countries the org tracks keywords in. */
  countries: string[] | null;
  enabled: boolean;
  created_at: string;
}

export interface DeleteTrackedKeywordResult {
  id: string;
  keyword_id: string;
  app_id: string;
  deleted: boolean;
}

export interface UntrackKeywordsResult {
  deleted: number;
  requested: number | null;
}

export interface UntrackAppResult {
  id: string;
  deleted: boolean;
}

export interface DeleteProductResult {
  id: string;
  deleted: boolean;
  untracked_apps: number;
}

export interface RemoveCompetitorResult {
  product_id: string;
  competitor_app_id: string;
  deleted: boolean;
  edges_removed: number;
}

export interface DeleteAlertResult {
  id: string;
  deleted: boolean;
}

export interface CompetitorKeyword {
  keyword_id: string;
  keyword: string | null;
  store: Store | null;
  country: string | null;
  competitor_rank: number;
  own_rank: number | null;
  gap: string | null;
  difficulty: number | null;
  popularity: number | null;
  /** Proxy estimate shown when the Apple SP is censored to its floor (5). */
  popularity_proxy?: number | null;
}

export interface DiscoveredKeyword {
  id: string;
  keyword_id: string;
  keyword: string;
  store: Store;
  country: string;
  rank: number | null;
  source: "autocomplete" | "metadata" | "serp_scan" | "competitor" | "apple_ads" | "ai";
  status: "new" | "tracked" | "hidden";
  bucket: "ranked" | "gap" | "idea" | null;
  popularity: number | null;
  popularity_proxy: number | null;
  popularity_source: "apple" | "proxy" | null;
  difficulty: number | null;
  ai_relevance: number | null;
  opportunity: number | null;
  discovered_at: string;
  ranks_checked_at: string | null;
}

export interface DiscoveredKeywordsResult {
  app_id: string;
  total: number;
  keywords: DiscoveredKeyword[];
}

export interface AlertEvent {
  id: string;
  type: AlertType;
  app_id: string | null;
  keyword_id: string | null;
  measured_at: string;
  payload: Record<string, unknown>;
  emailed_at: string | null;
  created_at: string;
}

export interface ReviewInsightTheme {
  theme: string;
  detail: string;
  frequency: "rare" | "occasional" | "common" | "very common";
  quotes: string[];
  trend: "new" | "persisting" | "growing" | "improving" | "resolved";
}

export interface ReviewInsightResult {
  app_id: string;
  country: string;
  insight: {
    generated_at: string;
    reviews_analyzed: number;
    avg_score: number | null;
    window_start: string | null;
    window_end: string | null;
    model: string | null;
    overview: string;
    sentiment: "very negative" | "negative" | "mixed" | "positive" | "very positive";
    praises: ReviewInsightTheme[];
    complaints: ReviewInsightTheme[];
    feature_requests: string[];
    changes_since_last: string | null;
  } | null;
  cooldown: {
    in_cooldown: boolean;
    next_available_at: string | null;
  };
}

export interface AppOverviewMover {
  keyword_id: string;
  keyword: string;
  country: string;
  rank: number | null;
  change_7d: number | null;
  popularity: number | null;
  difficulty: number | null;
}

export interface AppOverviewResult {
  app_id: string;
  app_name: string;
  store: Store;
  days: number;
  keywords: {
    tracked: number;
    ranked: number;
    ranked_delta_7d: number | null;
    top_10: number;
    best_rank: { rank: number; keyword: string } | null;
  };
  competitors: number;
  visibility: {
    score: number;
    delta_7d: number | null;
    share_of_voice: number | null;
    share_delta_7d: number | null;
    branded_excluded: number;
    spark: { date: string; value: number; share: number | null }[];
  };
  movement: {
    improved_7d: number;
    dropped_7d: number;
    top_improvements: AppOverviewMover[];
    top_drops: AppOverviewMover[];
  };
  rank_distribution: Array<
    { date: string; total: number } & Record<string, number | string>
  >;
  opportunities: Array<{
    keyword_id: string;
    keyword: string;
    country: string;
    kind: "near_page_one" | "top_three_push" | "easy_target";
    rank: number | null;
    popularity: number | null;
    difficulty: number | null;
  }>;
}

export interface PortfolioResult {
  kpis: {
    apps: number;
    keywords_tracked: number;
    keywords_ranked: number;
    top_10: number;
    up_7d: number;
    down_7d: number;
    visibility: number;
    visibility_prev_7d: number | null;
    visibility_delta_7d: number | null;
    avg_rating: number | null;
    alerts_this_week: number;
  };
  apps: Array<{
    app_id: string;
    app_name: string;
    icon_url: string | null;
    store: Store;
    keywords_tracked: number;
    keywords_ranked: number;
    top_10: number;
    best_rank: number | null;
    up_7d: number;
    down_7d: number;
    net_delta_7d: number;
    visibility: number;
    visibility_prev_7d: number | null;
    visibility_delta_7d: number | null;
    spark: { date: string; value: number }[];
    rating: number | null;
    rating_prev_7d: number | null;
    review_count: number | null;
  }>;
  movers_up: Array<Record<string, unknown>>;
  movers_down: Array<Record<string, unknown>>;
  attention: Array<Record<string, unknown>>;
  opportunities: Array<Record<string, unknown>>;
}

/** Why an App Store Connect endpoint has (or lacks) data. */
export type AscMetricsStatus =
  | "ready"
  | "not_connected"
  | "not_ios"
  | "app_not_in_account"
  | "pending"
  | "key_lacks_analytics";

/** Envelope fields shared by /apps/:id/sales and /apps/:id/engagement. */
export interface AscMetricsBase {
  app_id: string;
  app_name: string;
  store: Store;
  status: AscMetricsStatus;
  connected: boolean;
  /** Human-readable reason when status !== "ready", else null. */
  message: string | null;
  apple_app_id: string | null;
  last_synced_at: string | null;
  range: { start: string; end: string };
  reported_days: number;
}

export interface AppSalesMetrics {
  downloads: number;
  redownloads: number;
  iap_units: number;
  proceeds_usd_approx: number;
}

export interface AppSalesResult extends AscMetricsBase {
  totals: AppSalesMetrics | null;
  days: Array<
    | ({ date: string; reported: true } & AppSalesMetrics)
    | {
        date: string;
        reported: false;
        downloads: null;
        redownloads: null;
        iap_units: null;
        proceeds_usd_approx: null;
      }
  >;
  countries: Array<{ country: string } & AppSalesMetrics>;
}

export interface AppEngagementResult extends AscMetricsBase {
  totals: {
    impressions: number;
    product_page_views: number;
    downloads: number;
    installs: number;
    deletions: number;
    sessions: number;
  } | null;
  rates: {
    page_view_rate: number | null;
    download_rate: number | null;
    search_share: number | null;
  } | null;
  sources: Array<{
    source_type: string;
    impressions: number;
    product_page_views: number;
    share_of_impressions: number | null;
  }>;
  days: Array<{
    date: string;
    reported: boolean;
    impressions: number | null;
    product_page_views: number | null;
    installs: number | null;
    deletions: number | null;
    sessions: number | null;
    downloads: number | null;
  }>;
}

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
  results_count: number | null;
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
  discovered: number;
  ranked: number;
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
  | "competitor_change";

export interface AlertRule {
  id: string;
  type: AlertType;
  scope_app_id: string | null;
  threshold: number | null;
  effective_threshold: number | null;
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

# @sonarapp/mcp

## 0.10.1

### Patch Changes

- d408508: Refresh the README tool and command reference. The MCP README now lists all 55 tools grouped by plan (stateless, workspace reads, Agency-only, write tools, Screenshot Studio), notes which tools run keyless on the free tier, and corrects the default `SONAR_API_URL`. The CLI README lists every command, including `apps overview`, `apps sales`, `apps engagement`, `keywords discovered`, `portfolio`, `alerts` and `charts top`, and marks the Agency-only ones.

## 0.10.0

### Minor Changes

- 0d087a2: Add App Store Connect sales and engagement for your own iOS apps (Agency plan, App Store Connect connection required). New MCP tools `sonar_app_sales` (downloads, redownloads, IAP units, approximate USD proceeds, per-country breakdown) and `sonar_app_engagement` (impressions, product page views, downloads, conversion rates, search share, impressions by source, installs, deletions, sessions), and the matching CLI commands `sonar apps sales <id>` and `sonar apps engagement <id>` with `--start`, `--end`, `--days` and `--store`. Impressions follow App Store Connect's definition and include product page views. When data is missing, the response's `status` and `message` say why (not connected, not an iOS app, analytics still pending, key lacks the Admin role).
- 00b57be: Add the `top_chart` alert type: get notified when one of your apps enters or leaves a store top chart (overall and its category) in the countries you choose. `sonar_set_alert` and `sonar alerts set` accept a `countries` list (max 10) and a rank cutoff via `threshold` (default 200).

## 0.9.1

### Patch Changes

- 00da7ee: Explain daily ranking outcomes from the API's additive observations field: ranked, not found in completed search results, or no confirmed observation. CLI rank summaries use the latest dated outcome instead of an older position.

## 0.9.0

### Minor Changes

- 351f7af: Add an optional Android review language (`--lang` in the CLI, `lang` in MCP).
  Without a language, Sonar merges the market language plus English, Spanish,
  French, and Arabic review feeds, deduplicating reviews before sorting.

### Patch Changes

- 45d1874: Tell the truth about keywords a bulk metrics request couldn't serve. Terms the
  scraper queue sheds come back with an `error` and zeroed fields; the CLI table
  printed those zeros as data (difficulty 0, coloured "easiest") and counted them
  in the "credits charged" line even though the server refunds them. Shed rows
  now render as "rate limited — retry in 30s (not charged)", the charge line
  counts only served keywords, and the MCP tool folds the response's new
  `retry_after_seconds` into the term's message so agents back off at the drain
  rate — the `Retry-After` header is nonstandard on a 200 and proxies drop it.
- 3b80241: Surface the server's `Retry-After` hint in throttle errors. The API now sizes
  that header to the real scraper-queue depth, so a 429/503 message reads
  "Retry after 30s." instead of a bare "retry later" — agents and scripts back
  off at the drain rate rather than retrying straight back into congestion.
- 69c1983: Support native account linking on the hosted MCP transport with per-tool OAuth metadata, sign-in challenges and optional resource-specific credential verification. Complete tool safety annotations and return entitlement errors without purchase prompts. Keep local filesystem exports out of the hosted tool catalog and report the current package version during initialization.

## 0.8.1

### Patch Changes

- dc71090: Default API base URL is now `https://api.trysonar.app` — the dedicated API
  serving endpoint with drastically higher keyword-compute throughput.
  `https://trysonar.app` keeps working (it proxies to the same backend), and
  `SONAR_API_URL` / saved config still override the default.
- 2456508: Document the hosted endpoint's OAuth sign-in: connect at https://trysonar.app/mcp with no API key — OAuth-capable clients (Claude Code, claude.ai connectors) authorize via browser sign-in. README, server.json, and manifest updated; the registry server card now marks the Authorization header optional.
- c14349c: Top charts depth raised to 200 — the `limit` parameter of `sonar_top_charts` / `sonar charts top` now accepts 1-200, and summary/movers/dropped cover the full top 200.

## 0.8.0

### Minor Changes

- 20be68f: Tool titles + Claude Desktop extension bundle. Every tool now exposes a human-readable `title` (top-level and `annotations.title`) alongside the existing readOnly/destructive/idempotent hints — required for Anthropic's connectors directory. New `npm run build:mcpb` packs a self-contained `.mcpb` desktop-extension bundle (manifest with optional API-key user config, privacy policy links, auto-generated tool list).
- 20be68f: Competitor scan upgraded to the AI-first discovery pipeline. `sonar_scan_competitor` / `sonar competitors scan` now return `generated` / `queued` / `verified_now` counts: the scan generates terms from the competitor's listing (brand queries included), verifies the first batch inline (~30s), and the rest verify in the background — poll competitor keywords for results as they land. The previous `discovered` / `ranked` response fields are gone.
- a9a1d63: Top Charts. New `sonar charts top` command and `sonar_top_charts` MCP tool wrap `GET /api/v1/charts/top`: the store's top free/paid/grossing chart (overall or by category, any country) with day-over-day movement — per-app rank delta, apps new to the chart, the biggest movers, and apps that dropped out. Market-wide, so it needs no tracked apps, and it works without an API key on the anonymous free tier. `summary`, `movers` and `droppedApps` always describe the whole top 100; `--limit` / `limit` truncates the returned entries only.
- 20cead8: New `sonar_export_screenshots` tool: server-side rendering of screenshot sets
  to store-ready PNG ZIPs (one per locale, written to `output_dir`) via the new
  `GET /api/v1/screenshots/sets/:id/export` endpoint — no browser required. The
  API client gains a `getBinary` method for ZIP/PNG downloads.
- 83b69f5: Add app overview, Agency portfolio, discovered keywords, alert events, and AI review insights.
  - MCP: new tools `sonar_discovered_keywords`, `sonar_alert_events`, `sonar_review_insights`, `sonar_generate_review_insights`, `sonar_app_overview`, and `sonar_portfolio` (53 tools total, full v1 API parity).
  - CLI: new commands `sonar apps overview`, `sonar portfolio`, `sonar keywords discovered`, `sonar alerts events`, `sonar apps insights`, and `sonar apps analyze-reviews`.

### Patch Changes

- 6558083: Rename the user-facing plan name from "Full plan" to "Indie plan" in tool descriptions and error messages, matching current Sonar pricing. Update the Smithery badge to the new trysonar/sonar namespace.

## 0.7.0

### Minor Changes

- 2ed78f4: Free mode: the server now runs without `SONAR_API_KEY`. Keyless installs get Sonar's anonymous free tier — app search, app lookup, ASO score, keyword extraction, and keyword suggestions (shared 30 requests/day per IP) plus keyword metrics (5 keywords/day per IP). The client omits the `Authorization` header when no key is configured so requests reach the free tier instead of failing key validation, and free-tier tools say so in their descriptions. All other tools return the API's actionable 401 with signup instructions. `ClientConfig`/`createServer` also accept an optional `extraHeaders` map (used by the hosted /mcp transport to forward the end user's IP so free-tier limits apply per user). The client also self-identifies with a `sonar-mcp/<version>` User-Agent (overridable via `userAgent` in `ClientConfig`) so server-side usage stats can attribute MCP traffic, and the package now ships TypeScript declarations.
- c1b99c4: Revenue estimates now include a `confidence` grade (high/medium/low) and `confidence_factors` explaining it. The CLI prints the grade and factors in table output; the MCP tool description now instructs agents to communicate confidence alongside the number.
- e8db12c: Starred keywords: mark tracked keywords as favorites/targets. CLI gains `sonar keywords star <id>` / `unstar <id>` and shows a ★ marker in `keywords list`; MCP gains the `sonar_star_keyword` write tool, and `sonar_app_keywords` now returns `note` and `starred_at` per keyword.

### Patch Changes

- 8c7821e: Start and serve the MCP handshake even when SONAR_API_KEY is unset (warn on stderr instead of exiting) — registry inspectors probe keyless; tool calls without a key return an actionable 401 as tool output. All 43 tools now carry MCP annotations (readOnly/destructive/idempotent hints).
- eb0c134: Point repository and bugs links at the public GitHub mirrors (trysonar/cli, trysonar/mcp) so the Repository link on npm resolves for everyone.

## 0.6.0

### Minor Changes

- c4f4c16: Add teardown + alerts coverage to match the new v1 endpoints.

  MCP: 9 new tools — `sonar_list_products`, `sonar_list_alerts`, `sonar_delete_tracked_keyword`, `sonar_untrack_keywords`, `sonar_untrack_app`, `sonar_delete_product`, `sonar_remove_competitor`, `sonar_set_alert`, `sonar_delete_alert` (now 31 tools total).

  CLI: `keywords untrack`, `keywords untrack-all`, `apps untrack`, `products list`, `products delete`, `products remove-competitor`, and a new `alerts` group (`list`, `set`, `delete`). Destructive commands confirm unless `--force`.

## 0.5.0

### Minor Changes

- 9ff7f99: Full API parity: 9 new tools (22 total) so agents can read back everything they set up.

  New org-scoped read tools (Full plan, read scope):
  - `sonar_list_apps` — tracked apps with latest snapshots
  - `sonar_get_app` — app detail + 90 days of snapshots
  - `sonar_app_keywords` — tracked keywords with difficulty/popularity
  - `sonar_app_rankings` — rank history per keyword
  - `sonar_app_changes` — detected releases/metadata/screenshot/price/category changes
  - `sonar_keyword_rankings` — SERP history for a keyword
  - `sonar_competitor_keywords` — competitor keywords + gap analysis

  New write tools (Full plan + write scope):
  - `sonar_update_keyword_note` — set/clear the note on a tracked keyword
  - `sonar_scan_competitor` — run a competitor keyword discovery scan

  All new read tools carry `readOnlyHint: true` annotations; the client now supports PATCH.

## 0.4.0

### Minor Changes

- Add 4 workspace **write tools** so AI agents can set up a Sonar workspace from any MCP client:
  - `sonar_create_product` → `POST /api/v1/products`
  - `sonar_track_app` → `POST /api/v1/products/{id}/apps`
  - `sonar_track_competitor` → `POST /api/v1/products/{id}/competitors`
  - `sonar_track_keywords` → `POST /api/v1/apps/{id}/keywords` (bulk, idempotent)

  Write tools require a Full plan (trial counts) and an API key with the `write` scope — enforced server-side; 401/403 responses are translated into an actionable message. Tools carry MCP annotations (`readOnlyHint: false`) and say WRITE in their descriptions.

## 0.3.0

### Minor Changes

- 2197f20: Add `keywords metrics` endpoint — difficulty + popularity for a specific keyword or up to 25 in bulk. 1 credit per keyword, vs. 10 for `keywords search` which fans out into related ideas.

  **CLI:**

  ```bash
  sonar keywords metrics --store ios "habit tracker"
  sonar keywords metrics --store ios habit water sleep   # bulk, 1 credit each
  ```

  **MCP:** New `sonar_keyword_metrics` tool with `keyword` (single) or `keywords` (bulk array) arg.

### Patch Changes

- f350b42: Fix MCP server exiting silently when launched via `npx`, the global `sonar-mcp` bin shim, or any other symlinked entry point.

  The 0.2.0 `isMain` guard compared `import.meta.url` against a raw `file://${process.argv[1]}` string, but `process.argv[1]` resolves to the bin shim symlink while `import.meta.url` resolves to the real file. The guard returned false, `main()` never ran, and the process exited immediately — so MCP clients (Codex, Claude Desktop, Cursor, Cline) all saw `connection closed: initialize response`.

  The guard now resolves `argv[1]` through `realpathSync` before comparing, so direct invocation (`node dist/index.mjs`) and symlinked invocation (`npx -y @sonarapp/mcp`, `which sonar-mcp`) both correctly start the stdio transport. Added a regression test that spawns the built dist via a symlink and asserts the `initialize` handshake completes.

## 0.2.0

### Minor Changes

- 83d22db: Initial release.

  **`@sonarapp/cli`** — `sonar` CLI for App Store Optimization. Authenticate with `sonar auth login`, then research keywords (`sonar keywords search`), audit apps (`sonar apps get`), track rankings (`sonar rankings`), and run competitor analysis from the terminal. Reads `SONAR_API_KEY` / `SONAR_API_URL` from env or `~/.config/sonar/config.json`.

  **`@sonarapp/mcp`** — Sonar MCP server (`sonar-mcp`) exposing 8 stateless ASO tools to AI agents (Claude Desktop, Claude Code, Cursor, Cline): `sonar_app_lookup`, `sonar_app_search`, `sonar_app_aso_score`, `sonar_app_extract_keywords`, `sonar_app_reviews`, `sonar_app_revenue`, `sonar_keyword_search`, `sonar_keyword_suggestions`. Configure with `SONAR_API_KEY` env var.

# @sonarapp/mcp

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

# @sonarapp/mcp

[![npm](https://img.shields.io/npm/v/@sonarapp/mcp.svg)](https://www.npmjs.com/package/@sonarapp/mcp)
[![license](https://img.shields.io/npm/l/@sonarapp/mcp.svg)](./LICENSE)
[![smithery badge](https://smithery.ai/badge/trysonar/sonar)](https://smithery.ai/servers/trysonar/sonar)

The official **Sonar** MCP server — App Store Optimization tools for AI agents.

For the hosted **Grok Build and Cursor marketplace plugin**, see
[plugin setup, authentication, and permissions](./PLUGINS.md).

Lets Claude Desktop, Claude Code, Cursor, Cline, and any [Model Context Protocol](https://modelcontextprotocol.io)-compatible client look up apps, research keywords, audit ASO, mine reviews, and estimate revenue across the iOS App Store and Google Play. Powered by [Sonar](https://trysonar.app).

---

## Tools

55 tools covering the whole Sonar REST API, grouped by what they need.

### Read tools — stateless (any plan with credits)

| Tool | What it does | Works without a key |
|-|-|-|
| `sonar_app_lookup` | Look up app metadata by store ID | Yes |
| `sonar_app_search` | Search apps by keyword (returns store ranking order) | Yes |
| `sonar_app_aso_score` | ASO audit score (0-100) with itemized checks | Yes |
| `sonar_app_extract_keywords` | Extract target keywords from an app's listing | Yes |
| `sonar_app_reviews` | Fetch reviews with rating filters and sort options | — |
| `sonar_app_revenue` | Estimate monthly revenue with a confidence grade | — |
| `sonar_keyword_search` | Keyword research (difficulty, popularity, related terms) | — |
| `sonar_keyword_metrics` | Difficulty + popularity for specific keywords (up to 25 per call) | Yes (5 keywords/day) |
| `sonar_keyword_suggestions` | Autocomplete suggestions from the store | Yes |
| `sonar_top_charts` | Top free/paid/grossing chart with day-over-day movement | Yes |

Stateless tools work on **any plan with credits** (API Credits, Indie or Agency), for both iOS and Android. The ones marked "Yes" also run keyless on the free tier (see "Try it free" below).

### Read tools — your workspace (Indie plan)

| Tool | What it does |
|-|-|
| `sonar_list_products` | List your products with their linked store versions and competitor counts |
| `sonar_list_apps` | List your tracked apps with latest snapshots (rating, reviews, installs) |
| `sonar_get_app` | App detail + up to 90 days of snapshot history |
| `sonar_app_overview` | Dashboard scoreboard for an app: visibility, share of voice, movement, opportunities |
| `sonar_app_keywords` | Keywords tracked for an app, with difficulty, popularity, notes and stars |
| `sonar_app_rankings` | Daily rank history for an app's tracked keywords |
| `sonar_app_changes` | Detected releases, metadata edits, screenshot/price/category changes |
| `sonar_keyword_rankings` | SERP history for a tracked keyword (who ranked, when) |
| `sonar_discovered_keywords` | Untracked keywords Sonar discovered for an app, sorted by opportunity |
| `sonar_competitor_keywords` | Keywords a competitor ranks for + gap analysis vs your app |
| `sonar_competitor_landscape` | Gaps, threats and leads vs all your competitors + latest AI insight |
| `sonar_review_insights` | Latest AI review analysis: praise/complaint themes, quotes, trends |
| `sonar_list_alerts` | List your alert rules (type, scope, threshold, enabled) |
| `sonar_alert_events` | Detected alert events (rank moves, rating drops, review spikes), newest first |

Workspace reads require an **Indie plan** or higher (an active trial counts); the default `read`-scope key is enough.

### Read tools — Agency plan

| Tool | What it does |
|-|-|
| `sonar_portfolio` | Portfolio rollup: per-app KPIs, biggest movers, needs-attention list, top opportunities |
| `sonar_app_sales` | App Store Connect sales: downloads, redownloads, IAP units, approximate proceeds |
| `sonar_app_engagement` | App Store Connect funnel: impressions, page views, downloads, sources, sessions |

These require the **Agency plan** (an Agency trial counts) and return 403 on other plans. `sonar_app_sales` and `sonar_app_engagement` are iOS-only and also need an App Store Connect connection at [trysonar.app/settings/connections](https://trysonar.app/settings/connections); engagement data needs an Admin-role App Store Connect key.

### Write tools (Indie plan + write scope)

| Tool | What it does |
|-|-|
| `sonar_create_product` | Create a product in your Sonar workspace and start tracking its app(s) |
| `sonar_track_app` | Link the second-store version (iOS ↔ Android) of an existing product |
| `sonar_track_competitor` | Add a competitor app under a product |
| `sonar_remove_competitor` | Remove a competitor from a product |
| `sonar_delete_product` | Delete a product and untrack its apps |
| `sonar_untrack_app` | Untrack an app and its tracking data |
| `sonar_track_keywords` | Start daily rank tracking for keywords on an app (bulk, idempotent) |
| `sonar_update_keyword_note` | Set or clear the note on a tracked keyword |
| `sonar_star_keyword` | Star or unstar a tracked keyword (mark it as a target) |
| `sonar_delete_tracked_keyword` | Stop tracking one keyword/app pair |
| `sonar_untrack_keywords` | Bulk-untrack an app's keywords (selected IDs or all) |
| `sonar_scan_competitor` | Run an AI keyword discovery scan on a competitor (read results with `sonar_competitor_keywords`) |
| `sonar_analyze_competitors` | Generate a fresh AI competitive insight for one of your apps (7-day cooldown) |
| `sonar_generate_review_insights` | Generate a fresh AI review analysis for a tracked app (90-day cooldown) |
| `sonar_set_alert` | Create or update an alert rule |
| `sonar_delete_alert` | Delete an alert rule |

Write tools mutate your workspace and require an **Indie plan** or higher (an active trial counts) plus either an OAuth sign-in on the hosted endpoint (which carries write access) or an API key created with the **`write` scope**. The two AI generation tools, `sonar_analyze_competitors` and `sonar_generate_review_insights`, need a paid plan and are not available during the trial. The server enforces all of this — without it, calls return a 403 explaining what to fix.

Together these close the loop for agents: set up tracking with the write tools, then read back rankings, changes, and gap analyses with the workspace tools.

### Screenshot Studio (Indie plan)

| Tool | What it does | Scope |
|-|-|-|
| `sonar_screenshot_layout_guide` | Layout-format reference; read it once before authoring layouts | none |
| `sonar_screenshot_devices` | Supported device sizes and their canvas dimensions | read |
| `sonar_list_screenshot_sets` | A product's screenshot sets (metadata only) | read |
| `sonar_get_screenshot_set` | A full set: every screen's layout plus translation overrides | read |
| `sonar_create_screenshot_set` | Create a screenshot set for a product | write |
| `sonar_update_screenshot_set` | Rename a set, replace its locales, or reorder its screens | write |
| `sonar_delete_screenshot_set` | Delete a set and everything in it | write |
| `sonar_add_screenshot` | Append a screen to a set | write |
| `sonar_update_screenshot` | Replace one screen's layout | write |
| `sonar_delete_screenshot` | Delete one screen (a set keeps at least one) | write |
| `sonar_set_screenshot_translations` | Write a locale's translation overrides | write |
| `sonar_export_screenshots` | Render store-ready PNGs into one local ZIP per locale | read |

Agents author screenshot sets as layout JSON; humans review and fine-tune the same sets in the Screenshot Studio. The layout guide is embedded in the server and needs no key. `sonar_export_screenshots` writes files on the machine running the server, so it's available over stdio only, not on the hosted endpoint.

## Hosted endpoint — no install, no API key

OAuth-capable MCP clients (Claude Code, claude.ai custom connectors) can skip both the npm install and the API key entirely:

```
claude mcp add --transport http sonar https://trysonar.app/mcp
```

The first tool call that needs your account opens a browser sign-in — approve it with your Sonar login and the agent has full access to the workspace you own (read + write). Clients without OAuth support can pass an API key instead: `--header "Authorization: Bearer aso_..."`.

### ChatGPT submission and hosted behavior

Submit `https://trysonar.app/mcp/chatgpt` to OpenAI. This endpoint returns tool-level sign-in challenges; `/mcp` retains HTTP 401 challenges for Claude and other MCP clients. Both advertise OAuth per tool. Anonymous store lookups can run without linking; workspace tools return a native sign-in challenge when authorization is missing or expired. Connect an existing Sonar account and approve access to the workspace you own. Existing account permissions and entitlements apply.

The ChatGPT endpoint requires resource-bound JWT access tokens for its canonical `/mcp/chatgpt` audience; the existing `/mcp` endpoint retains Clerk opaque-token support. Provider configuration and an end-to-end login must be verified before submitting the ChatGPT endpoint.

The hosted catalog excludes `sonar_export_screenshots`, which writes ZIP files to the local MCP host. It remains available over stdio. A native directory listing requires separate OpenAI review and publication; hosting an MCP endpoint does not itself create a listing.

## Try it free — no API key needed

The server runs without a key in **free mode**: `sonar_app_search`, `sonar_app_lookup`, `sonar_app_aso_score`, `sonar_app_extract_keywords`, `sonar_keyword_suggestions`, and `sonar_top_charts` share a free allowance of 30 requests/day per IP, and `sonar_keyword_metrics` (keyword difficulty + popularity) gets 5 keywords/day. Just install it with no `env` block and ask your agent about ASO. When you hit the limit, the error tells you how to sign up.

## Get an API key

For everything else (tracking, rankings, competitors, higher limits) you'll need a Sonar API key — get one at [trysonar.app/developers](https://trysonar.app/developers).

The cheapest path is **prepaid API credits** — packs from $10 (1,000 credits), with 50 free credits on signup and no subscription. Built specifically for this use case. See [pricing](https://trysonar.app/#pricing).

## Install

### Claude Desktop

Add to your config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "sonar": {
      "command": "npx",
      "args": ["-y", "@sonarapp/mcp"],
      "env": {
        "SONAR_API_KEY": "aso_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop. The `sonar_*` tools will appear in the tool picker.

### Claude Code

```bash
claude mcp add sonar -e SONAR_API_KEY=aso_your_key_here -- npx -y @sonarapp/mcp
```

### Cursor

Add to `~/.cursor/mcp.json` (or your project's `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "sonar": {
      "command": "npx",
      "args": ["-y", "@sonarapp/mcp"],
      "env": {
        "SONAR_API_KEY": "aso_your_key_here"
      }
    }
  }
}
```

### Cline / other MCP clients

Most clients use the same `command` + `args` + `env` shape as above. Point the command at `npx -y @sonarapp/mcp` and pass `SONAR_API_KEY` in the env.

## Configuration

| Variable | Required | Default | Description |
|-|-|-|-|
| `SONAR_API_KEY` | no (free mode without it) | — | Your Sonar API key (`aso_...`) |
| `SONAR_API_URL` | no | `https://api.trysonar.app` | Override the API base URL (only used for self-hosting / staging) |

## Example prompts

> "Use Sonar to look up Spotify on iOS in the US store and report its rating, review count, and category."

> "Run an ASO audit on `com.duolingo` on Android and tell me what to fix."

> "Research the keyword 'habit tracker' on iOS — give me difficulty, popularity, and 5 related terms with lower difficulty I should consider."

> "Pull the 50 most recent 1- and 2-star reviews of `1517783697` on iOS US and group complaints by theme."

> "Search 'meditation' on the App Store and estimate monthly revenue for the top 5 results."

## Privacy Policy

Full policy: **<https://trysonar.app/privacy>**

The MCP server is a thin client around Sonar's REST API — it stores nothing locally and no data is logged by this package itself.

- **Data collected:** tool inputs (app IDs, keywords, country codes) are sent to Sonar's API over HTTPS to produce results; authenticated requests include your API key as a `Bearer` token. Sonar logs API requests (endpoint, status, timing) for rate limiting and abuse prevention.
- **Data usage:** inputs are used solely to serve the request (keyword metrics, app lookups, etc.); resulting JSON is returned to your AI client.
- **Storage & retention:** the package keeps no state on disk. Server-side request logs are retained for 90 days; workspace data (tracked apps/keywords) persists in your Sonar account until you delete it.
- **Third-party sharing:** no user data is sold or shared with third parties; queries against public app-store data (Apple, Google) contain no personal information.
- **Contact:** [hello@trysonar.app](mailto:hello@trysonar.app)

## Troubleshooting

**"SONAR_API_KEY is not set — running in free mode"** — Expected if you haven't configured a key: the free tools keep working with per-IP daily limits. If you DID configure a key, the MCP client did not pass the env var through — check the `env` section of your client's config file. Some clients require an absolute path to `npx` — try `which npx` and use that.

**"Authentication failed"** — Your key is invalid, expired, or your subscription lapsed. Visit [trysonar.app/developers](https://trysonar.app/developers) to check.

**"Access denied. This endpoint may require an Indie plan subscription"** — The 10 stateless read tools work on any plan with credits. The workspace read, write, and Screenshot Studio tools require an Indie plan or higher (an active trial counts); write tools additionally need an API key created with the `write` scope. `sonar_portfolio`, `sonar_app_sales`, and `sonar_app_engagement` require the Agency plan, and the two AI generation tools need a paid plan (not a trial). If you're on a setup or trial-expired plan, reactivate first.

## Companion: CLI

Prefer the terminal? Use [`@sonarapp/cli`](https://www.npmjs.com/package/@sonarapp/cli) (`sonar` binary) — same data, same API key.

## License

MIT © Peter Sutarik

# @sonarapp/mcp

[![npm](https://img.shields.io/npm/v/@sonarapp/mcp.svg)](https://www.npmjs.com/package/@sonarapp/mcp)
[![license](https://img.shields.io/npm/l/@sonarapp/mcp.svg)](./LICENSE)
[![smithery badge](https://smithery.ai/badge/sutarik-peter/sonar)](https://smithery.ai/servers/sutarik-peter/sonar)

The official **Sonar** MCP server — App Store Optimization tools for AI agents.

Lets Claude Desktop, Claude Code, Cursor, Cline, and any [Model Context Protocol](https://modelcontextprotocol.io)-compatible client look up apps, research keywords, audit ASO, mine reviews, and estimate revenue across the iOS App Store and Google Play. Powered by [Sonar](https://trysonar.app).

---

## Tools

### Read tools — stateless

| Tool | What it does |
|-|-|
| `sonar_app_lookup` | Look up app metadata by store ID |
| `sonar_app_search` | Search apps by keyword (returns store ranking order) |
| `sonar_app_aso_score` | ASO audit score (0-100) with itemized checks |
| `sonar_app_extract_keywords` | Extract target keywords from an app's listing |
| `sonar_app_reviews` | Fetch reviews with rating filters and sort options |
| `sonar_app_revenue` | Estimate monthly revenue with methodology |
| `sonar_keyword_search` | Keyword research (difficulty, popularity, related terms) |
| `sonar_keyword_metrics` | Difficulty + popularity for specific keywords (single or bulk) |
| `sonar_keyword_suggestions` | Autocomplete suggestions from the store |
| `sonar_top_charts` | Top free/paid/grossing chart with day-over-day movement |

Stateless tools work on **any plan with credits**, with both iOS and Android.

### Read tools — your workspace (Full plan)

| Tool | What it does |
|-|-|
| `sonar_list_apps` | List your tracked apps with latest snapshots (rating, reviews, installs) |
| `sonar_get_app` | App detail + up to 90 days of snapshot history |
| `sonar_app_keywords` | Keywords tracked for an app, with difficulty + popularity |
| `sonar_app_rankings` | Daily rank history for an app's tracked keywords |
| `sonar_app_changes` | Detected releases, metadata edits, screenshot/price/category changes |
| `sonar_keyword_rankings` | SERP history for a tracked keyword (who ranked, when) |
| `sonar_competitor_keywords` | Keywords a competitor ranks for + gap analysis vs your app |
| `sonar_competitor_landscape` | Full competitive picture for one of your own apps — gap/winnable/threat/lead stats + latest AI insight |

Workspace reads require a **Full plan** (an active trial counts); the default `read`-scope key is enough.

### Write tools (Full plan + write scope)

| Tool | What it does |
|-|-|
| `sonar_create_product` | Create a product in your Sonar workspace and start tracking its app(s) |
| `sonar_track_app` | Link the second-store version (iOS ↔ Android) of an existing product |
| `sonar_track_competitor` | Add a competitor app under a product |
| `sonar_track_keywords` | Start daily rank tracking for keywords on an app (bulk, idempotent) |
| `sonar_update_keyword_note` | Set or clear the note on a tracked keyword |
| `sonar_scan_competitor` | Run a keyword discovery scan on a competitor (read results with `sonar_competitor_keywords`) |
| `sonar_analyze_competitors` | Generate a fresh AI competitive insight for one of your own apps (7-day cooldown; read it with `sonar_competitor_landscape`) |

Write tools mutate your workspace and require a **Full plan** (an active trial counts) plus an API key created with the **`write` scope**. The server enforces both — without them, calls return a 403 explaining what to fix.

Together these close the loop for agents: set up tracking with the write tools, then read back rankings, changes, and gap analyses with the workspace tools.

## Try it free — no API key needed

The server runs without a key in **free mode**: `sonar_app_search`, `sonar_app_lookup`, `sonar_app_aso_score`, `sonar_app_extract_keywords`, and `sonar_keyword_suggestions` share a free allowance of 30 requests/day per IP, and `sonar_keyword_metrics` (keyword difficulty + popularity) gets 5 keywords/day. Just install it with no `env` block and ask your agent about ASO. When you hit the limit, the error tells you how to sign up.

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
| `SONAR_API_URL` | no | `https://trysonar.app` | Override the API base URL (only used for self-hosting / staging) |

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

**"Access denied. Endpoint may require Full plan"** — The 10 stateless read tools work on any plan with credits. The workspace read tools and write tools require a Full plan (an active trial counts); write tools additionally need an API key created with the `write` scope. If you're on a setup or trial-expired plan, reactivate first.

## Companion: CLI

Prefer the terminal? Use [`@sonarapp/cli`](https://www.npmjs.com/package/@sonarapp/cli) (`sonar` binary) — same data, same API key.

## License

MIT © Peter Sutarik

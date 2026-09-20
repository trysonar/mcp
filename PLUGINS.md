# Sonar marketplace plugin

Sonar helps app developers research keywords, audit listings, analyze reviews and
competitors, and manage rank tracking across the iOS App Store and Google Play.

This repository includes Grok Build and Cursor plugin manifests for the same
hosted MCP integration. Marketplace approval is separate from publishing these
files; their presence does not mean that Sonar is already listed.

## Connection and authentication

The plugin uses Streamable HTTP at `https://trysonar.app/mcp`. It requires no local
server, npm installation, shell command, hooks, or background process. The npm
server elsewhere in this repository is a separate installation option and is
not executed by the plugin.

Selected public research tools have limited anonymous access. Connect your own
Sonar account through the client's OAuth flow when you need private workspace
tools or additional access. Sonar uses authorization code with S256 PKCE and
dynamic client registration through Clerk. Complete sign-in in the browser;
do not paste credentials into chat.

OAuth links the workspace owned by the signed-in user, with read and write
access subject to the account's entitlements. Team-seat workspace switching is
not supported by this OAuth path. Some tools change or delete workspace data;
review the requested operation before approving it in your client.

Clients that do not support OAuth can configure an API key in their secure MCP
settings as an `Authorization: Bearer <key>` header. Use a read-only key for
research and reporting; write operations require a key with write scope. No key
or other secret is included in the plugin.

## Access and limitations

- Anonymous research has per-IP usage limits. Other research tools and higher
  usage require available API credits or the appropriate account entitlements.
- Private workspace features require an eligible subscription or active trial.
  All calls enforce account permissions, rate limits, and plan/credit checks.
- Ranking history exists only where tracking data has been collected.
- Popularity and revenue figures are estimates.
- The hosted connector does not publish store listings, process payments, or
  export files to a local filesystem. Subscriptions and API credits are managed
  separately on the Sonar website.

## Network endpoints and data

- `https://trysonar.app/mcp`: MCP discovery and tool calls. Tool arguments include
  app identifiers, keywords, countries, and workspace identifiers as required by
  the requested task. Calls return public store data or authorized workspace data.
- `https://trysonar.app/.well-known/oauth-protected-resource/mcp`: OAuth resource
  discovery; identifies the authorization server and required identity scopes.
- `https://clerk.trysonar.app`: OAuth discovery, client registration,
  authorization, and token endpoints. Scope names are `openid profile email`.
- `https://trysonar.app`: browser-based Sonar sign-in and consent pages as needed
  during account linking, along with documentation and account management.

There are no plugin hooks, local filesystem access, shell execution, or added
telemetry. The hosted service processes requests under the
[Sonar privacy policy](https://trysonar.app/privacy).

## Example prompts

- "Use Sonar to find iOS apps ranking for sleep tracker in the US."
- "Audit this app's store listing and explain the three most useful improvements."
- "Research keyword opportunities for my Android app and compare difficulty and popularity estimates."
- "Show my tracked apps and keywords whose rankings have changed recently."
- "Compare my app with its tracked competitors and explain promising keyword gaps."
- "Add these keywords to tracking for my app, then confirm which were added."

## Documentation and ownership

Published by [Sonar](https://trysonar.app), operated by Edge Analytics s.r.o.
Official source: [trysonar/mcp](https://github.com/trysonar/mcp).

- [MCP documentation](https://trysonar.app/docs/mcp)
- [REST API specification](https://trysonar.app/openapi.json)
- [Support](https://trysonar.app/support): hello@trysonar.app
- [Privacy policy](https://trysonar.app/privacy)
- [Terms of service](https://trysonar.app/terms)

The plugin configuration and this repository are MIT licensed; see [LICENSE](LICENSE).
Use of the hosted Sonar service is governed by its terms of service.

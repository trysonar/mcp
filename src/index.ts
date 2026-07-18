import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createClient } from "./client.js";
import { runTool, tools, toolsByName } from "./tools/index.js";

const PACKAGE_NAME = "@sonarapp/mcp";
const SERVER_NAME = "sonar";
const SERVER_VERSION = "0.7.0";

function readConfigFromEnv(): ServerConfig {
  const apiKey = process.env.SONAR_API_KEY;
  const baseUrl = process.env.SONAR_API_URL ?? "https://trysonar.app";
  if (!apiKey) {
    // Inform but keep serving: keyless callers get the API's free tier —
    // app search/lookup, keyword suggestions, ASO score, keyword extraction,
    // and a small daily allowance of keyword metrics (per-IP limits). Other
    // tools return an actionable 401 from the API as tool output.
    process.stderr.write(
      `${PACKAGE_NAME}: SONAR_API_KEY is not set — running in free mode.\n` +
        `Free (limited/day): app search & lookup, keyword suggestions, ASO\n` +
        `score, keyword extraction, keyword metrics. Other tools need a key.\n` +
        `Get an API key at https://trysonar.app/developers and pass it via the\n` +
        `MCP server's "env" config:\n\n` +
        `  {\n` +
        `    "mcpServers": {\n` +
        `      "sonar": {\n` +
        `        "command": "npx",\n` +
        `        "args": ["-y", "${PACKAGE_NAME}"],\n` +
        `        "env": { "SONAR_API_KEY": "aso_..." }\n` +
        `      }\n` +
        `    }\n` +
        `  }\n`
    );
  }
  return { apiKey: apiKey ?? "", baseUrl };
}

export interface ServerConfig {
  apiKey: string;
  baseUrl: string;
  extraHeaders?: Record<string, string>;
  userAgent?: string;
}

export function createServer(config?: ServerConfig) {
  const cfg = config ?? readConfigFromEnv();
  const client = createClient({
    ...cfg,
    userAgent: cfg.userAgent ?? `sonar-mcp/${SERVER_VERSION}`,
  });

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      title: tool.title,
      description: tool.description,
      inputSchema: z.toJSONSchema(tool.inputSchema, {
        target: "draft-7",
        io: "input",
      }) as Record<string, unknown>,
      // `annotations.title` is where pre-2025-06-18 clients (and directory
      // reviewers) look for the display name; emit it in both locations.
      annotations: { title: tool.title, ...tool.annotations },
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = toolsByName[request.params.name];
    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Unknown tool: ${request.params.name}. Available: ${Object.keys(
              toolsByName
            ).join(", ")}`,
          },
        ],
      };
    }
    return runTool(tool, request.params.arguments ?? {}, client);
  });

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only auto-start when invoked as the entry point — keeps the module
// importable without spawning stdio. We resolve symlinks on argv[1] so the
// guard also fires when launched via the bin shim (npx, pnpm dlx, the
// global `sonar-mcp` symlink) where the shim path differs from
// import.meta.url. Without realpath, MCP clients like Codex would see the
// process exit immediately with no stdio response.
const entry = (() => {
  try {
    return pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return undefined;
  }
})();
if (entry && import.meta.url === entry) {
  main().catch((err) => {
    process.stderr.write(`${PACKAGE_NAME}: fatal error: ${err}\n`);
    process.exit(1);
  });
}

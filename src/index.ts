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
const SERVER_VERSION = "0.5.0";

function readConfigFromEnv(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env.SONAR_API_KEY;
  const baseUrl = process.env.SONAR_API_URL ?? "https://trysonar.app";
  if (!apiKey) {
    process.stderr.write(
      `${PACKAGE_NAME}: SONAR_API_KEY is not set.\n` +
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
    process.exit(1);
  }
  return { apiKey, baseUrl };
}

export function createServer(config?: { apiKey: string; baseUrl: string }) {
  const cfg = config ?? readConfigFromEnv();
  const client = createClient(cfg);

  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: z.toJSONSchema(tool.inputSchema, {
        target: "draft-7",
        io: "input",
      }) as Record<string, unknown>,
      ...(tool.annotations ? { annotations: tool.annotations } : {}),
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

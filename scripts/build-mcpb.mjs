// Build the Claude Desktop extension bundle (sonar-mcp.mcpb).
//
// Regenerates the `tools` array and `version` in manifest.json from the
// package source (so the manifest can never drift from the registered
// tools), then packs the bundle with the official `mcpb` CLI. Run from
// packages/mcp via `npm run build:mcpb` — assumes `npm run build` already
// produced dist-mcpb/.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(join(pkgDir, "dist-mcpb/index.mjs"))) {
  console.error("dist-mcpb/index.mjs missing — run `npm run build` first.");
  process.exit(1);
}

// tools/index.ts has no runtime side effects, so importing it via tsx gives
// us the canonical tool registry without spawning the stdio server.
const toolsJson = execSync("npx tsx scripts/print-tools-json.ts", {
  cwd: pkgDir,
  encoding: "utf8",
}).trim();
const tools = JSON.parse(toolsJson.split("\n").pop());

const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const manifestPath = join(pkgDir, "manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = pkg.version;
manifest.tools = tools;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`manifest.json: version ${pkg.version}, ${tools.length} tools`);

execSync("npx --yes @anthropic-ai/mcpb pack . sonar-mcp.mcpb", {
  cwd: pkgDir,
  stdio: "inherit",
});

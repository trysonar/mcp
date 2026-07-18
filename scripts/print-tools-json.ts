// Helper for build-mcpb.mjs: print the tool registry as manifest.json
// `tools` entries (name + short display description).
import { tools } from "../src/tools/index.js";

console.log(
  JSON.stringify(tools.map((t) => ({ name: t.name, description: t.title })))
);

import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node20',
    outDir: 'dist',
    clean: true,
    // Emit .d.mts so consumers (incl. the app's /mcp route importing
    // createServer) type-check against the real signatures instead of TS
    // inferring a narrower shape from the bundled JS.
    dts: true,
    outExtension: () => ({ js: '.mjs' }),
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  {
    // Self-contained build for the Claude Desktop extension (.mcpb bundle):
    // deps (@modelcontextprotocol/sdk, zod) are bundled in so the extension
    // runs without node_modules. Packed by scripts/build-mcpb.mjs.
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node20',
    outDir: 'dist-mcpb',
    clean: true,
    dts: false,
    noExternal: [/.*/],
    outExtension: () => ({ js: '.mjs' }),
  },
]);

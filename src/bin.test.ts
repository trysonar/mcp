import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it, expect, beforeAll } from "vitest";

// Regression test for the 0.2.0 bug: the `isMain` guard compared
// import.meta.url to `file://${process.argv[1]}` literally, so launching the
// built dist via a symlink (which is exactly what `npx`, `pnpm dlx`, and the
// global `sonar-mcp` bin shim do) made the guard false and main() never ran.
// MCP clients like Codex saw the process exit with no stdio handshake.

const DIST = resolve(__dirname, "..", "dist", "index.mjs");

async function sendInitialize(
  entry: string,
  env: NodeJS.ProcessEnv = { ...process.env, SONAR_API_KEY: "aso_bin_test" }
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number | null;
}> {
  return new Promise((resolveP, reject) => {
    const child = spawn(process.execPath, [entry], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
      // Kill as soon as we get a JSON-RPC response — proves stdio is alive.
      if (stdout.includes('"jsonrpc"')) child.kill();
    });
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("exit", (code) => resolveP({ stdout, stderr, exitCode: code }));
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "bin-test", version: "1.0" },
        },
      }) + "\n"
    );
    setTimeout(() => child.kill(), 3000);
  });
}

describe("bin entrypoint", () => {
  beforeAll(() => {
    if (!existsSync(DIST)) {
      throw new Error(
        `dist/index.mjs not found at ${DIST}. Run \`npm run build\` first.`
      );
    }
  });

  it("responds to initialize when launched directly", async () => {
    const { stdout } = await sendInitialize(DIST);
    expect(stdout).toContain('"jsonrpc"');
    expect(stdout).toContain('"protocolVersion"');
  });

  it("still serves the handshake without SONAR_API_KEY (registry inspectors probe keyless)", async () => {
    const env = { ...process.env };
    delete env.SONAR_API_KEY;
    const { stdout, stderr } = await sendInitialize(DIST, env);
    expect(stdout).toContain('"jsonrpc"');
    expect(stdout).toContain('"protocolVersion"');
    expect(stderr).toContain("SONAR_API_KEY is not set");
  });

  it("responds to initialize when launched via a symlink (bin shim parity)", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "sonar-mcp-bin-"));
    const shim = join(tmp, "sonar-mcp-shim.mjs");
    symlinkSync(DIST, shim);
    try {
      const { stdout } = await sendInitialize(shim);
      expect(stdout).toContain('"jsonrpc"');
      expect(stdout).toContain('"protocolVersion"');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

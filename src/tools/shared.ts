import type { ApiClient } from "../client.js";
import { SonarApiError } from "../client.js";
import { z } from "zod";

export interface ToolDefinition<I extends z.ZodType> {
  name: string;
  /**
   * Human-readable display name. Required — the Claude connectors directory
   * rejects tools without a title.
   */
  title: string;
  description: string;
  inputSchema: I;
  /** Hosted tools require OAuth unless explicitly anonymous or optional. */
  authentication?: "none" | "optional";
  /** Tools that operate on the MCP host's filesystem must not be hosted. */
  localOnly?: boolean;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    openWorldHint: boolean;
    idempotentHint?: boolean;
  };
  handler: (args: z.infer<I>, client: ApiClient) => Promise<unknown>;
}

export type Tool = ToolDefinition<z.ZodType>;

export interface McpToolResult {
  // Index signature keeps this assignable to the SDK's CallToolResult
  // union (required for the .d.mts build).
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

export interface ToolRuntime {
  oauth?: { resourceMetadataUrl: string; scopes: string[] };
  hasCredentials?: boolean;
  hosted?: boolean;
  /** Optional resource-specific verification in addition to backing API auth. */
  validateCredentials?: () => Promise<boolean>;
}

function authenticationRequired(runtime: ToolRuntime): McpToolResult {
  const metadataUrl = runtime.oauth!.resourceMetadataUrl;
  return {
    isError: true,
    content: [{ type: "text", text: "Connect your Sonar account to continue." }],
    _meta: {
      "mcp/www_authenticate": [
        `Bearer resource_metadata="${metadataUrl}", error="invalid_token", error_description="Connect your Sonar account to continue"`,
      ],
    },
  };
}

/**
 * Run a tool handler and shape the result into the MCP response envelope.
 * On success, JSON-stringifies the data. On SonarApiError, returns isError
 * with a human-readable message so the agent can recover or retry.
 */
export async function runTool<I extends z.ZodType>(
  tool: ToolDefinition<I>,
  rawArgs: unknown,
  client: ApiClient,
  runtime: ToolRuntime = {}
): Promise<McpToolResult> {
  const parsed = tool.inputSchema.safeParse(rawArgs);
  if (!parsed.success) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Invalid arguments for ${tool.name}: ${parsed.error.issues
            .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("; ")}`,
        },
      ],
    };
  }

  if (runtime.oauth && !runtime.hasCredentials && !tool.authentication) {
    return authenticationRequired(runtime);
  }
  if (runtime.oauth && runtime.hasCredentials && runtime.validateCredentials) {
    if (!(await runtime.validateCredentials())) return authenticationRequired(runtime);
  }

  try {
    const data = await tool.handler(parsed.data, client);
    // Strings (e.g. the embedded layout guide) pass through raw — JSON-quoting
    // them would escape every newline and waste the agent's context.
    const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return {
      content: [{ type: "text", text }],
    };
  } catch (err) {
    if (err instanceof SonarApiError) {
      if (runtime.oauth && err.status === 401) {
        return authenticationRequired(runtime);
      }
      // Native plugins may explain missing entitlements, but must not promote
      // subscription/credit purchases. Keep API/CLI error text unchanged.
      let message = runtime.hosted && [401, 402, 403].includes(err.status)
        ? err.status === 401
          ? "Authentication failed. Reconnect your Sonar account."
          : "This tool is unavailable with this account's current permissions or entitlements."
        : err.message;
      if (runtime.hosted && err.status === 429) {
        const retryHint = err.message.match(/Retry after \d+s\./i)?.[0];
        message = "This request exceeds the current usage limit. Reduce the batch size or retry later.";
        if (retryHint) message += ` ${retryHint}`;
      }
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Sonar API error (${err.status} ${err.code}): ${message}`,
          },
        ],
      };
    }
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: runtime.hosted
            ? `Tool ${tool.name} could not complete. Please retry later.`
            : `Tool ${tool.name} failed: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }
}

/**
 * Translate a write-endpoint 401/403 into an actionable message. The server
 * enforces the actual gating (Indie plan + `write`-scope key) — we only make
 * its rejection self-explanatory so the agent can tell the user what to fix.
 */
function mapWriteAuthError(err: unknown): never {
  if (
    err instanceof SonarApiError &&
    (err.status === 401 || err.status === 403)
  ) {
    throw new SonarApiError(
      err.status,
      err.code,
      `${err.message} Sonar write tools require an API key with the "write" scope ` +
        `(create one at https://trysonar.app/settings/developers) and an Indie plan ` +
        `(an active trial counts).`
    );
  }
  throw err;
}

/** POST helper for write tools — see mapWriteAuthError. */
export async function postWrite<T>(
  client: ApiClient,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  try {
    return await client.post<T>(path, body);
  } catch (err) {
    mapWriteAuthError(err);
  }
}

/** PATCH helper for write tools — see mapWriteAuthError. */
export async function patchWrite<T>(
  client: ApiClient,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  try {
    return await client.patch<T>(path, body);
  } catch (err) {
    mapWriteAuthError(err);
  }
}

/** DELETE helper for write tools — see mapWriteAuthError. */
export async function deleteWrite<T>(
  client: ApiClient,
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  try {
    return await client.delete<T>(path, params);
  } catch (err) {
    mapWriteAuthError(err);
  }
}

export const writeAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: false,
} as const;

/** Reads confined to the user's workspace or bundled reference material. */
export const readAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
} as const;

/** Queries of public app stores, rather than a bounded private workspace. */
export const publicReadAnnotations = { ...readAnnotations, openWorldHint: true } as const;
export const publicWriteAnnotations = { ...writeAnnotations, openWorldHint: true } as const;

export const storeSchema = z
  .enum(["ios", "android"])
  .describe('App store. "ios" for Apple App Store, "android" for Google Play.');

export const countrySchema = z
  .string()
  .length(2)
  .toLowerCase()
  .default("us")
  .describe('ISO 3166-1 alpha-2 country code (e.g. "us", "gb", "de"). Default "us".');

export const cursorSchema = z
  .string()
  .min(1)
  .optional()
  .describe(
    "Pagination cursor from a previous call's `next_cursor`. Omit for the first page."
  );

export const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(200)
  .optional()
  .describe("Page size (1-200). Server default applies when omitted.");

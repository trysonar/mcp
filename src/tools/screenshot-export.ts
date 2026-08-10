import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { ApiResponse } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

type ExportMeta = {
  id: string;
  name: string;
  device_size: string;
  width: number;
  height: number;
  source_locale: string;
  locales: string[];
  screens: Array<{ id: string; position: number }>;
};

const exportInputSchema = z.object({
  set_id: z.string().min(1).describe("Screenshot set id."),
  locales: z
    .array(z.string().min(2).max(8))
    .max(40)
    .optional()
    .describe(
      'Locales to export (e.g. ["de-DE","ja"]). Use the set\'s source locale code for the source renders. Omit together with all_locales for source-only.'
    ),
  all_locales: z
    .boolean()
    .optional()
    .describe("Export the source locale plus every enabled locale."),
  output_dir: z
    .string()
    .min(1)
    .describe(
      "Directory to write the ZIPs into (created if missing). One ZIP per locale, named <locale>.zip, each containing store-ready 01.png…NN.png."
    ),
});

export const exportScreenshotsTool: ToolDefinition<typeof exportInputSchema> = {
  name: "sonar_export_screenshots",
  title: "Export Screenshots (PNG)",
  description:
    "Render a screenshot set to store-ready PNGs SERVER-SIDE (no browser needed) and save them as one ZIP per locale in output_dir — ready for App Store Connect / Play Console upload. Rendering happens through the same engine as the Screenshot Studio editor. Writes to the filesystem of the machine running the MCP server, so this tool is for local (stdio) use; over the hosted transport call GET /api/v1/screenshots/sets/:id/export directly instead.",
  inputSchema: exportInputSchema,
  annotations: readAnnotations,
  async handler(args, client) {
    const meta = (
      await client.get<ApiResponse<ExportMeta>>(
        `/api/v1/screenshots/sets/${encodeURIComponent(args.set_id)}/export`,
        { meta: 1 }
      )
    ).data;

    let locales: string[];
    if (args.all_locales) {
      locales = [meta.source_locale, ...meta.locales];
    } else if (args.locales && args.locales.length > 0) {
      const known = new Set([meta.source_locale, ...meta.locales]);
      const unknown = args.locales.filter((l) => !known.has(l));
      if (unknown.length > 0) {
        throw new Error(
          `Locale(s) not on this set: ${unknown.join(", ")}. Enabled: ${meta.source_locale} (source), ${meta.locales.join(", ")}`
        );
      }
      locales = args.locales;
    } else {
      locales = [meta.source_locale];
    }

    await mkdir(args.output_dir, { recursive: true });
    const written: Array<{ locale: string; file: string }> = [];
    for (const locale of locales) {
      const bytes = await client.getBinary(
        `/api/v1/screenshots/sets/${encodeURIComponent(args.set_id)}/export`,
        locale === meta.source_locale ? {} : { locale }
      );
      const file = path.join(args.output_dir, `${locale}.zip`);
      await writeFile(file, bytes);
      written.push({ locale, file });
    }

    return {
      set: { id: meta.id, name: meta.name, device_size: meta.device_size },
      dimensions: `${meta.width}x${meta.height}`,
      screens: meta.screens.length,
      exported: written,
      note: "Each ZIP contains 01.png…NN.png in store upload order; unzip and upload per locale.",
    };
  },
};

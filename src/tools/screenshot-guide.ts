import { z } from "zod";
import type { ApiResponse } from "../types.js";
import { readAnnotations, type ToolDefinition } from "./shared.js";

// Condensed from docs/screenshot-layout-format.md — the canonical write-side
// contract is the zod schema behind the API, which rejects anything invalid
// with a field-level error message.
const LAYOUT_GUIDE = `# Sonar Screenshot Studio — layout format & workflow

App-store screenshot sets are declarative JSON scenes. You author layouts via
the API/tools; humans can then review and fine-tune the same set in the
Screenshot Studio web editor (every set response includes its \`studio_url\`).

## Recommended workflow
1. \`sonar_screenshot_devices\` → pick a device (canvas size = coordinate space).
2. \`sonar_create_screenshot_set\` with 3–10 \`screens\` layouts (or a template).
3. Iterate with \`sonar_update_screenshot\` / \`sonar_add_screenshot\`.
4. Localize with \`sonar_set_screenshot_translations\`.
5. Hand the \`studio_url\` to the human for review and PNG/ZIP export.

## Layout document
\`\`\`jsonc
{
  "background": {
    "color": "#0F172A",          // #RGB or #RRGGBB
    "color2": "#7B2D8E",         // optional → linear gradient color→color2
    "angle": 180,                // gradient direction, CSS convention (0–360)
    "shapes": [                  // optional accent shapes, max 16, above fill / below layers
      { "id": "flow-1", "kind": "blob",   // "blob" (organic) | "circle" (exact ellipse)
        "fill": "#059669", "x": -400, "y": 2600,  // centre, canvas px (may lie outside the slice)
        "rx": 900, "ry": 500, "opacity": 0.8, "rotation": 0,
        "seed": 12345 }          // blob outline is a pure function of seed/rx/ry
    ]
  },
  "layers": [                    // drawn bottom → top, max 50
    { "type": "text", "id": "headline", "x": 103, "y": 168,
      "width": 1084,             // wrap width
      "text": "TRACK YOUR PROGRESS",                   // ≤500 chars
      "fontFamily": "Poppins, system-ui, sans-serif",  // see fonts below
      "fontSize": 110, "fontStyle": "bold",            // "normal" | "bold"
      "fill": "#ffffff", "align": "center",            // left | center | right
      "letterSpacing": 0, "lineHeight": 1,             // optional
      "autoFit": true, "maxHeight": 380 },             // ALWAYS set on headlines (see rules)
    { "type": "device-frame", "id": "device", "x": 145, "y": 838,
      "width": 1000,             // frame height derives from the device aspect
      "device": "iphone-6.7",    // a device id (see sonar_screenshot_devices)
      "frameTone": "dark",       // "dark" (default) | "light"
      "perspective": "flat",     // flat | tilt-left | tilt-right | tilt-up | tilt-down | tilt-left-up | ...
      "screenshotDataUrl": "https://example.com/capture.png" },  // in-app capture, or null
    { "type": "image", "id": "badge", "x": 60, "y": 60,
      "width": 300, "height": 120,
      "imageDataUrl": "https://example.com/badge.png" },         // or null
    { "type": "shape", "id": "accent", "shape": "rect",          // "rect" | "ellipse"
      "x": 100, "y": 100, "width": 400, "height": 200,
      "fill": "#FFFFFF", "cornerRadius": 32,                     // rect only
      "stroke": "#000000", "strokeWidth": 8 }                    // optional
  ]
}
\`\`\`
All layers share optional \`rotation\`, \`opacity\` (0–1), \`name\`, \`hidden\`, \`locked\`.
Layer \`id\`s must be unique within a layout (≤64 chars) — translations key on them.

## Rules
- Coordinates are native canvas pixels of the set's device (e.g. 1290×2796 for
  iphone-6.7), origin top-left. What you author is exactly what exports.
- **Images**: \`screenshotDataUrl\` / \`imageDataUrl\` accept \`https://\` URLs at the
  API boundary — they are fetched server-side (PNG/JPEG/WebP, ≤4MB, max 12 per
  request) and stored inline as data URLs. Inline \`data:image/...;base64,\` also
  accepted but bloats request bodies.
- Layers may overflow the slice; the editor shows slices side by side so art
  can intentionally bleed into the neighbouring screenshot.
- **Set \`autoFit: true\` + \`maxHeight\` on EVERY text layer you author.** Text
  geometry is fixed — copy that wraps into extra lines grows down over the
  device, and a word wider than the box sticks out of the slice. Auto-fit
  shrinks the font at draw time until the text fits both the wrap width and
  \`maxHeight\`, and it re-runs per locale, so long translations fix themselves.
  Budget ≈16 characters per line at fontSize 92 on a 960px-wide box; size
  \`maxHeight\` to the gap above the next layer (e.g. headline at y 130 with the
  device at y 540 → maxHeight ≈ 380).
- **Flowing background shapes**: each exported PNG renders only its own layout,
  so a background shape continuing across a seam must be stored in BOTH slices —
  same id/kind/fill/seed/radii, with x shifted by exactly one slice width
  (x: 1100 in slice 1 ⇒ x: 1100 − 1290 = −190 in slice 2 on iphone-6.7).
- Device frame chrome (bezel, buttons, Dynamic Island / punch hole) is drawn by
  the renderer — do NOT bake chrome into the capture image.
- Fonts (store as "<Family>, system-ui, sans-serif"): Inter, Poppins,
  Montserrat, DM Sans, Space Grotesk, Manrope, Nunito, Playfair Display, Lora,
  Bebas Neue, Caveat, JetBrains Mono, or plain system-ui.
- Store limits: Apple shows up to 10 screenshots, Google Play up to 8. The
  first 2–3 are what most users ever see — put the strongest message first.

## Translations
Geometry/styling live ONLY on the source layout. A locale override is sparse,
keyed by layer id, and can only swap localizable content:
\`\`\`jsonc
{ "headline": { "text": "VERFOLGE DEINE FORTSCHRITTE" },
  "device":   { "screenshotDataUrl": "https://example.com/capture-de.png" },
  "badge":    { "imageDataUrl": null } }
\`\`\`
Anything not overridden falls back to the source, so partial locales still
render. Locale codes look like de-DE, pt-BR, zh-Hans.

## Templates (alternative to authoring screens yourself)
blank, single-feature, three-features, title-subtitle, continuous-bleed,
gradient-hero, light-minimal, big-type, device-duo, store-ready-set,
caption-below, tilted-spotlight, floating-device, full-bleed-device,
panorama-trio, zigzag, pastel-pop, sunset-flow.`;

const guideInputSchema = z.object({});

export const screenshotLayoutGuideTool: ToolDefinition<typeof guideInputSchema> = {
  name: "sonar_screenshot_layout_guide",
  description:
    "The layout-format reference for Sonar screenshot sets. Call this ONCE before creating or editing screenshot layouts — it documents the layout JSON schema, coordinate system, image handling (remote URLs), flowing background shapes, fonts, translation overrides, and the recommended workflow.",
  inputSchema: guideInputSchema,
  annotations: readAnnotations,
  async handler() {
    return LAYOUT_GUIDE;
  },
};

const devicesInputSchema = z.object({});

export const screenshotDevicesTool: ToolDefinition<typeof devicesInputSchema> = {
  name: "sonar_screenshot_devices",
  description:
    "List the device sizes supported for app-store screenshot sets, with their canvas dimensions (the pixel coordinate space all layouts use) and which store each belongs to. Pick a device here before sonar_create_screenshot_set.",
  inputSchema: devicesInputSchema,
  annotations: readAnnotations,
  async handler(_args, client) {
    const res = await client.get<ApiResponse<unknown>>(
      "/api/v1/screenshots/devices"
    );
    return res.data;
  },
};

---
name: logo-creator
description: Create original application and brand logos from a text brief, reference images, or both, then package usable delivery assets including SVG, PNG, JPG, and favicon outputs. Use this whenever the user asks for a logo, app icon, brand mark, wordmark, lockup, favicon, or a reusable logo asset bundle, even if they only mention an app launch, startup branding, or "make me a logo" without naming file formats.
argument-hint: "[brand brief, app name, reference image path, or export request]"
---

# Logo Creator

Create original logos and ship them as a practical asset package rather than a single mockup.

## When to Use

- Application logo creation
- Startup or product brand mark design
- App icon plus wordmark systems
- Favicon and reusable logo asset export
- Refreshing an existing logo based on references
- Producing SVG-first brand assets for product, web, or document use

## Principles

- Create original work. Do not imitate, trace, or closely mimic protected brand logos.
- Push toward SVG as the source of truth so the output stays editable.
- Package deliverables for real usage, not just presentation.
- Ask only for the smallest missing information set that materially affects the result.

## Input Routing

Read `references/input-routing.md`.

Determine which input mode applies:

- text brief
- reference images
- mixed brief plus references

If the user has provided enough context to move forward, do not stall with broad discovery questions. Offer 2-3 directions and recommend one.

## Direction Setting

Read `references/logo-directions.md`.

Before drawing the logo, propose 2-3 directions that are meaningfully different in tone or structure. For each direction, include:

- one-line concept summary
- why it fits the brand or app
- a tradeoff or risk

Recommend one direction unless the user clearly wants to choose first.

## Creation Workflow

1. Detect the input mode.
2. Fill only critical missing context.
3. Propose 2-3 directions and recommend one.
   - If the user explicitly asks to choose, present directions and wait for their selection before proceeding.
   - If the user says "just pick one", "choose for me", or gives no preference signal, proceed with the recommended direction immediately.
   - If the eval or prompt says to choose autonomously, state the chosen direction and continue.
4. Produce the logo system in editable SVG form.
5. Create the delivery package defined in `references/delivery-spec.md`.
6. Use `scripts/export-logo-assets.cjs` to export raster assets when SVG sources are ready.
7. Return a concise delivery summary describing what each asset is for.

## Output Expectations

Read `references/delivery-spec.md`.

Default package:

- primary logo
- icon-only mark
- wordmark-only version when the brand name supports it
- horizontal lockup
- vertical lockup

Default exported formats:

- SVG
- transparent PNG
- JPG on a solid background
- favicon `.ico`

If a requested variant does not make design sense, say so explicitly and explain what was shipped instead.

## Export Script

Use this script when you have one or more SVG sources ready:

```bash
node scripts/export-logo-assets.cjs \
  --input path/to/logo.svg \
  --output out/logos \
  --name acme
```

If you pass only `--input`, the script exports that SVG as the `primary` logo. Use repeated `--variant key=path/to/file.svg` arguments when you want a multi-variant delivery tree.

Multi-variant example:

```bash
node scripts/export-logo-assets.cjs \
  --variant mark=./mark.svg \
  --variant horizontal=./lockup.svg \
  --output out/logos \
  --name acme
```

The script:

- copies SVG sources into a delivery tree
- tries to rasterize PNG assets using available local tools
- derives JPG exports with the requested background when the local toolchain supports flattening, otherwise it warns and falls back to the safest supported behavior
- writes favicon `.ico` when PNG rasterization succeeds
- emits `export-manifest.json` with outputs and warnings

If local rasterization tools are unavailable, the script still writes SVG deliverables and a warning manifest. Do not claim PNG, JPG, or favicon files exist unless the script actually produced them.

## Delivery Summary Format

Include a short summary like this:

```text
Delivered:
- primary logo: svg, png, jpg
- icon mark: svg, png, favicon
- horizontal lockup: svg, png, jpg

Notes:
- PNG and favicon were exported successfully
- JPG uses a white background for broad compatibility
```

## Quality Bar

- The mark should remain legible at small sizes.
- The icon version should still work without the wordmark.
- The SVG should avoid unnecessary complexity that makes later editing painful.
- Favicon output should prioritize clarity over detail.

## Output Checklist

Before finishing, verify:

- [ ] Directions were proposed and one was selected (unless export-only)
- [ ] SVG source is editable and avoids unnecessary complexity
- [ ] Mark variant works without the wordmark
- [ ] Mark stays legible at 32px
- [ ] Favicon output prioritizes clarity over detail
- [ ] Export manifest was generated and matches delivered files
- [ ] Delivery summary lists every variant and its formats
- [ ] Any skipped exports are explained

## References

- Input routing: `references/input-routing.md`
- Direction patterns: `references/logo-directions.md`
- Delivery package rules: `references/delivery-spec.md`

## Evaluation

Initial prompts live in `evals/evals.json`.
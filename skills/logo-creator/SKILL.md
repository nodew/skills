---
name: logo-creator
description: Create original application and brand logos from a text brief, reference images, or both, then deliver SVG masters and package additional assets such as PNG, JPG, and favicon outputs when explicitly requested. Use this whenever the user asks for a logo, app icon, brand mark, wordmark, lockup, favicon, or a reusable logo asset bundle, even if they only mention an app launch, startup branding, or "make me a logo" without naming file formats.
argument-hint: "[brand brief, app name, reference image path, or export request]"
---

# Logo Creator

Create production-ready logo systems from natural language input, reference images, or both, and deliver SVG-first logo assets with optional export packaging when requested.

## Scope

Use this skill for four kinds of work:

1. Create a new logo system from a text brief.
2. Create or refresh a logo using reference images as style signals.
3. Redesign an existing logo while preserving some brand equity.
4. Package existing SVG logo assets into export-ready deliverables.

The default system includes:

- `mark` — icon-only symbol in a square container
- `vertical` — stacked lockup (icon above, brand name below)
- `horizontal` — side-by-side lockup (icon left, brand name right)

Do not produce a standalone wordmark (text-only, no icon). Outlined text alone carries no distinctive brand identity — the brand name is already present in the lockup variants.

If a requested variant does not make sense, omit it and say why.

## Non-Negotiables

- Keep the idea singular. The logo should have one memorable move, not several competing ones.
- Design in black first. If the form fails in monochrome, it is not ready.
- Keep the mark original. Use references for direction, never for imitation.
- Make the mark survive small sizes, especially favicon and app-icon use.
- Outline wordmarks before delivery. Do not ship live text in SVGs.
- Keep icon containers square. Pad when needed; never distort the symbol to fill the square.

For the detailed reasoning and construction rules behind these constraints, read:

- `references/geometry.md` for shape logic and SVG implementation rules
- `references/typography.md` for wordmark selection and treatment
- `references/lockups.md` for lockup structure, spacing, and delivery variants
- `references/modernism.md` for reduction and timelessness principles

## Workflow

### 1. Parse the request

Extract the smallest set of information needed to proceed:

- brand or product name
- what it does
- intended tone or audience
- whether it must function as an app icon
- whether the user wants concept exploration, a redesign, or export-only help

Treat reference images as style signals, not templates to reproduce.

Ask follow-up questions only when missing information would materially change the result. Do not block on low-value discovery work such as long backstory or competitor analysis.

Routing:

- If the user only wants exports for existing SVGs, skip concept development and go straight to packaging.
- If the user explicitly requests specific export formats (PNG, JPG, favicon, asset bundle), note this for step 5.
- If the brief is strong enough, move directly to concept directions.
- If the brief is weak but recoverable, ask for the smallest missing set and continue.

### 2. Set directions and dispatch parallel design

When the user needs ideation, propose 3-5 directions that differ structurally, not just stylistically. Default to 3 directions. Expand to 4-5 only when the brief clearly supports additional, genuinely distinct concepts. For each direction, include:

- a one-line concept summary
- why it fits the brand or product
- one tradeoff or risk

Typical direction families:

- geometric symbol-led
- monogram or letterform-led
- negative-space effect-led
- contained emblem-led
- compound-shape or modular-system-led

Once the directions are defined, dispatch one subagent per direction to build the mark and lockups in parallel. Each subagent receives:

- the brand brief and parsed context from step 1
- the assigned concept direction
- instruction that the direction must be structurally distinct from the others, not just a styling variation
- references to read (`references/geometry.md`, `references/typography.md`, `references/lockups.md`)
- the output path for its variant set
- instruction to produce SVG deliverables only (no raster export unless the user explicitly requested it)

Present all completed directions to the user for selection. Do not pre-select a winner — let the user compare and choose.

### 3. Build the mark (per direction, via subagent)

Read `references/geometry.md` before constructing the icon.

Build from simple geometric logic:

1. Choose the base shape language.
2. Translate the brand idea into a single visual move.
3. Reduce until the silhouette reads instantly.
4. Check that the symbol still works at small sizes.
5. Keep the icon in a square container without stretching it.

### 4. Build lockups (per direction, via subagent)

Read `references/typography.md` before choosing type treatment for lockups.
Read `references/lockups.md` before constructing variants.

Choose a type direction that supports the symbol instead of competing with it. Keep the text simple when the symbol carries the distinction. Convert all text to outlined SVG paths.

Create the variants that are actually useful for the brief. At minimum, provide a symbol-only mark and one primary lockup. Add horizontal or vertical variants when they improve usability across product, web, or document contexts.

### 5. Package and export (only when requested)

By default, deliver SVG files only. Do not run the export pipeline unless the user explicitly asks for raster formats (PNG, JPG), favicons, or a full asset bundle at the start of the conversation.

When export is requested, use `scripts/export-logo-assets.cjs` once the user has selected a direction and the SVG sources are finalized.

Single-input example:

```bash
node scripts/export-logo-assets.cjs \
  --input path/to/logo.svg \
  --output out/logos \
  --name acme
```

Multi-variant example:

```bash
node scripts/export-logo-assets.cjs \
  --variant mark=./mark.svg \
  --variant vertical=./vertical.svg \
  --variant horizontal=./horizontal.svg \
  --output out/logos \
  --name acme
```

The script writes SVG deliverables, attempts PNG and JPG exports when supported by the local toolchain, creates favicon assets when rasterization succeeds, and emits `export-manifest.json` with outputs and warnings.

Do not claim raster files exist unless the script actually produced them.

## Response Format

When you deliver work, keep the response compact and concrete:

1. List all directions produced (with one-line concept summary each).
2. For each direction, summarize the mark and type treatment decisions.
3. List the variants delivered per direction.
4. Ask the user to select a direction (or refine).
5. After selection, list final formats produced and call out any skipped exports.

Example (initial delivery):

```text
Directions produced:

1. Folded Triangle — forward motion and precision, geometric symbol-led.
2. Negative-Space Letter — the initial letter forms a hidden symbol, negative-space effect-led.
3. Geometric Emblem — structured badge enclosing a simplified icon, contained emblem-led.

Each direction includes: mark + horizontal + vertical lockups (SVG).

Please select a direction to finalize, or request changes.
```

Example (after selection, with export requested):

```text
Finalized: Direction 1 — Folded Triangle (geometric symbol-led)

Formats produced:
- SVG for all variants
- PNG for mark and horizontal
- favicon assets from the mark

Notes:
- JPG was skipped because local flattening support was unavailable.
```

## Checklist

Before delivering, verify:

- [ ] The concept is singular and easy to describe.
- [ ] The logo works in black.
- [ ] The mark remains legible at small sizes.
- [ ] The icon container is square and undistorted.
- [ ] All text in SVGs is outlined (no live text).
- [ ] The chosen variants match the user's real usage needs.
- [ ] The SVGs follow the implementation guidance in `references/geometry.md`.
- [ ] Any claimed exports are present in `export-manifest.json` (when export was requested).
- [ ] Missing variants or formats are explained.
- [ ] All directions were built in parallel via subagents.
- [ ] The user was given a choice between directions before finalizing.

## Anti-Patterns

- copying or closely mimicking existing brand logos
- multiple ideas fighting inside one mark
- literal clip-art style symbols with no reduction
- decorative effects that carry the design instead of the form
- over-detailed geometry that collapses at small sizes
- fake inset background plates inside icon canvases
- rounded icon containers unless the user explicitly asks for them

## References

- Geometric foundations and SVG rules: `references/geometry.md`
- Typography selection and treatment: `references/typography.md`
- Lockup construction and delivery variants: `references/lockups.md`
- Modernist reduction principles: `references/modernism.md`

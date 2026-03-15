---
name: design-system
description: Generate design tokens (theme colors, spacing, typography, components) from any input — screenshots, text prompts, brand briefs, or existing CSS. Uses a three-layer architecture (primitive → semantic → component). Supports light/dark themes, CSS variables, and Tailwind integration. Triggers on requests for design tokens, theming, component specs, or design-to-code handoff.
argument-hint: "[screenshot path, brand description, or component name]"
---

# Design System

Token architecture, component specifications, and systematic design.

## When to Use

- Design token creation (colors, spacing, typography, shadows, radius)
- Extracting design tokens from screenshots or existing UI
- Generating tokens from brand descriptions or mood keywords
- Extracting tokens from existing CSS/Tailwind codebases
- Component state definitions and variant specs
- CSS variable systems with light/dark themes
- Spacing and typography scale generation
- Design-to-code handoff
- Tailwind theme configuration

## Token Architecture

Load: `references/token-architecture.md`

### Three-Layer Structure

```
Primitive (raw values)
       ↓
Semantic (purpose aliases)
       ↓
Component (component-specific)
```

**Example:**
```css
/* Primitive */
--color-blue-600: #2563EB;

/* Semantic */
--color-primary: var(--color-blue-600);

/* Component */
--button-bg: var(--color-primary);
```

## Quick Start

**Generate tokens:**
```bash
node scripts/generate-tokens.cjs --config tokens.json -o tokens.css
```

**Generate Tailwind config:**
```bash
node scripts/generate-tokens.cjs --config tokens.json --format tailwind
```

**Validate usage (find hardcoded values):**
```bash
node scripts/validate-tokens.cjs --dir src/
```

## References

| Topic | File |
|-------|------|
| **Extraction** | |
| From Screenshot | `references/extract-from-screenshot.md` |
| From Prompt/Brief | `references/extract-from-prompt.md` |
| From Existing Code | `references/extract-from-code.md` |
| **Token Layers** | |
| Token Architecture | `references/token-architecture.md` |
| Primitive Tokens | `references/primitive-tokens.md` |
| Semantic Tokens | `references/semantic-tokens.md` |
| Component Tokens | `references/component-tokens.md` |
| **Specs** | |
| Component Specs | `references/component-specs.md` |
| States & Variants | `references/states-and-variants.md` |
| Tailwind Integration | `references/tailwind-integration.md` |

## Input Detection & Routing

Detect the input type and route to the appropriate extraction workflow:

| Input Type | Detection Signal | Workflow |
|------------|-----------------|----------|
| Screenshot | File path to image (.png/.jpg/.webp) | `references/extract-from-screenshot.md` |
| Text Prompt | Brand name, mood words, industry, color preferences | `references/extract-from-prompt.md` |
| Existing Code | File path to .css/.scss/.ts or directory | `references/extract-from-code.md` |
| Brand Brief | Detailed brand doc with logo colors, guidelines | `references/extract-from-prompt.md` |
| Manual | Explicit token values provided by user | Direct to token generation |

### Routing Rules

1. If the user provides an **image path** → Read the image, then follow `extract-from-screenshot.md`
2. If the user describes a **mood, brand, or style** → Follow `extract-from-prompt.md`
3. If the user points to **existing code** → Follow `extract-from-code.md`
4. If the user gives **explicit values** → Skip extraction, generate tokens directly
5. If **no input** is given → Ask the user which input method they prefer

## Core Workflow

1. **Detect input type** using the routing table above.
2. **Extract design intent** using the matched extraction reference.
3. Read `references/token-architecture.md` for the three-layer model.
4. Read the relevant reference for the token category being generated.
5. Generate tokens as JSON (`templates/design-tokens-starter.json` as starting point, `templates/brand-presets.json` for preset values).
6. Run `generate-tokens.cjs` to produce CSS variables.
7. Optionally configure Tailwind integration.
8. Validate with `validate-tokens.cjs`.

## Component Spec Pattern

| Property | Default | Hover | Active | Disabled |
|----------|---------|-------|--------|----------|
| Background | primary | primary-dark | primary-darker | muted |
| Text | white | white | white | muted-fg |
| Border | none | none | none | muted-border |
| Shadow | sm | md | none | none |

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/generate-tokens.cjs` | Generate CSS or Tailwind config from JSON tokens |
| `scripts/validate-tokens.cjs` | Find hardcoded values that should use tokens |

## Templates

| Template | Purpose |
|----------|---------|
| `templates/design-tokens-starter.json` | Starter JSON with three-layer structure |
| `templates/brand-presets.json` | Industry/mood-based color and style presets |

## Integration

**With Tailwind:** Tokens map to CSS variables consumed by `tailwind.config.ts` via `hsl(var(--*))`.
**With shadcn/ui:** Token naming aligns with shadcn conventions for drop-in compatibility.
**With ui-prototype skill:** Design tokens feed into HTML prototype generation for consistent theming. The `ui-prototype` skill calls `design-system` as its first step.

## Token Compliance

```css
/* CORRECT — uses token */
background: var(--color-primary);
color: var(--color-foreground);
padding: var(--space-4);

/* WRONG — hardcoded */
background: #2563EB;
color: #111827;
padding: 16px;
```

## Best Practices

1. Never use raw hex in components — always reference tokens
2. Semantic layer enables theme switching (light/dark)
3. Component tokens enable per-component customization
4. Document every token's purpose
5. Use the three-layer model: primitive → semantic → component
6. Keep primitive values stable; change semantic mappings for theming

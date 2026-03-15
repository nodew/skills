# Extract Tokens from Existing Code

Reverse-engineer design tokens from an existing CSS/Tailwind/JS codebase.

## When to Use

- Migrating an existing project to a token-based system
- Auditing an existing codebase for design consistency
- Creating a design system from an existing product

## Extraction Workflow

### Step 1: Identify Source Files

Scan the project for styling sources:

```
Priority order:
1. globals.css / app.css / index.css (token definitions)
2. tailwind.config.ts / tailwind.config.js (theme extensions)
3. theme.ts / theme.js (JS theme objects)
4. CSS/SCSS files with custom properties
5. Component files with inline styles or Tailwind classes
```

Use Glob to find candidates:
- `**/*.css` — CSS files
- `**/tailwind.config.*` — Tailwind config
- `**/theme.{ts,js,json}` — Theme files
- `**/globals.css` — Global styles

### Step 2: Extract Existing CSS Variables

Search for existing custom properties:

```
Pattern: --[a-z][a-z0-9-]*
```

Categorize found variables:

| Category | Pattern | Example |
|----------|---------|---------|
| Colors | `--color-*`, `--*-foreground`, `--bg-*` | `--color-primary: #2563EB` |
| Spacing | `--space-*`, `--gap-*`, `--padding-*` | `--space-4: 1rem` |
| Typography | `--font-*`, `--text-*`, `--leading-*` | `--font-size-sm: 0.875rem` |
| Radius | `--radius-*`, `--rounded-*` | `--radius-md: 0.375rem` |
| Shadows | `--shadow-*` | `--shadow-sm: 0 1px 2px ...` |

### Step 3: Extract Tailwind Config

If `tailwind.config.ts` exists, extract:

```typescript
// Look for:
theme: {
  extend: {
    colors: { ... },      // → color tokens
    spacing: { ... },      // → spacing tokens
    fontSize: { ... },     // → typography tokens
    borderRadius: { ... }, // → radius tokens
    boxShadow: { ... },   // → shadow tokens
  }
}
```

Map Tailwind extensions to token layers:

| Tailwind Key | Token Layer | Token Category |
|--------------|-------------|----------------|
| `colors.primary` | semantic | `--color-primary` |
| `colors.gray.*` | primitive | `--color-gray-*` |
| `spacing` | primitive | `--space-*` |
| `fontSize` | primitive | `--font-size-*` |
| `borderRadius` | primitive | `--radius-*` |

### Step 4: Scan for Hardcoded Values

Use `scripts/validate-tokens.cjs` to find hardcoded values:

```bash
node scripts/validate-tokens.cjs --dir src/
```

Or manually search for:

| Pattern | What It Reveals |
|---------|----------------|
| `#[0-9A-Fa-f]{3,8}` | Hardcoded hex colors |
| `rgb(` / `rgba(` / `hsl(` | Hardcoded color functions |
| `\d+px` (not 0 or 1) | Hardcoded pixel values |
| `\d+rem` | Hardcoded rem values |

### Step 5: Deduplicate and Normalize

Group extracted values:

```
Colors found:
  #2563EB (used 12 times) → candidate for --color-primary
  #EF4444 (used 5 times)  → candidate for --color-destructive
  #F3F4F6 (used 8 times)  → candidate for --color-muted
  #E5E7EB (used 15 times) → candidate for --color-border

Spacing found:
  16px (used 30 times)    → candidate for --space-4
  8px (used 25 times)     → candidate for --space-2
  24px (used 18 times)    → candidate for --space-6

Radius found:
  0.375rem (used 20 times) → candidate for --radius-md
  0.5rem (used 10 times)   → candidate for --radius-lg
```

### Step 6: Map to Three-Layer Model

Organize deduplicated values into the three-layer architecture:

```
PRIMITIVE (raw values found)
├── color: unique hex values → gray scale, brand colors
├── spacing: unique px/rem values → 4px grid snapped
├── fontSize: unique font sizes → type scale
├── radius: unique border-radius values
└── shadow: unique box-shadow values

SEMANTIC (purpose assignment)
├── color: most-used button color → primary
├── color: most-used bg color → background
├── color: most-used text color → foreground
└── color: red variants → destructive

COMPONENT (per-component)
├── button: padding, radius, colors from button components
├── card: padding, shadow, radius from card components
└── input: border, padding, radius from input components
```

### Step 7: Generate Token JSON

Produce `design-tokens.json` with the mapped values.

## Output Format

Present extraction results as:

```
## Code Extraction Results

### Source Files Analyzed
- src/globals.css (32 variables found)
- tailwind.config.ts (15 extensions)
- 45 component files scanned

### Existing Token System
- [x] CSS custom properties: 32 found
- [ ] Tailwind config extensions: partial
- [ ] Design token JSON: not found

### Extracted Colors (deduplicated)
| Hex | Usage Count | Suggested Token |
|-----|-------------|----------------|
| #2563EB | 12 | --color-primary |
| ... | ... | ... |

### Extracted Spacing
| Value | Count | Suggested Token |
|-------|-------|----------------|
| 16px | 30 | --space-4 |
| ... | ... | ... |

### Hardcoded Values to Migrate
- 47 hardcoded hex colors
- 23 hardcoded pixel values
- 8 hardcoded rem values

### Migration Priority
1. High: 5 colors used >10 times (most impact)
2. Medium: 12 spacing values used >5 times
3. Low: 30 one-off values (consider if they should be tokens)
```

## Migration Strategy

After extraction, suggest a migration path:

1. **Create token file** from extracted values
2. **Replace high-frequency values** first (biggest consistency win)
3. **Run validate-tokens.cjs** to track migration progress
4. **Update component by component** rather than all at once

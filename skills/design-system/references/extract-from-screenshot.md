# Extract Tokens from Screenshot

Extract design tokens from UI screenshots by visual analysis.

## Prerequisites

- Screenshot file accessible via absolute path
- Use the Read tool to view the image (Claude Code supports PNG, JPG, WEBP)

## Extraction Workflow

### Step 1: Read the Screenshot

```
Read the image file at the provided path.
```

Analyze the image systematically. Do NOT guess — only extract what is clearly visible.

### Step 2: Extract Colors

Scan the screenshot for distinct colors in this order:

| Element | What to Look For | Maps To |
|---------|-----------------|---------|
| Background | Page/section backgrounds | `--color-background`, `--color-card` |
| Primary action | Buttons, links, active states | `--color-primary` |
| Text | Headings, body, captions | `--color-foreground`, `--color-muted-foreground` |
| Borders | Dividers, card edges, input borders | `--color-border` |
| Status | Success/error/warning indicators | `--color-success`, `--color-error`, `--color-warning` |
| Accent | Highlights, badges, tags | `--color-accent` |

#### Color Extraction Rules

1. **Identify the dominant background** — this is `--color-background`
2. **Find the primary action color** — buttons, links, toggles → `--color-primary`
3. **Derive the color scale** — from the primary color, generate 50-900 shades
4. **Check dark mode** — if the screenshot has dark areas, infer dark theme mappings
5. **Estimate hex values** — describe the color precisely (e.g., "muted blue-gray, approximately #64748B")

### Step 3: Extract Spacing

| Pattern | What to Measure | Maps To |
|---------|----------------|---------|
| Component padding | Space inside cards, buttons, inputs | `--space-2` to `--space-6` |
| Component gap | Space between elements in a row/column | `--space-2` to `--space-4` |
| Section spacing | Space between major sections | `--space-8` to `--space-16` |
| Page margins | Edge padding of the viewport | `--spacing-page-x`, `--spacing-page-y` |

#### Spacing Rules

1. Estimate based on visual proportions, not pixel-perfect measurement
2. Snap to the 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
3. Note if spacing appears tight (dense UI) or loose (marketing page)

### Step 4: Extract Typography

| Element | Properties to Note | Maps To |
|---------|-------------------|---------|
| Headings | Size, weight, color | `--font-heading`, `--font-weight-bold` |
| Body text | Size, line-height | `--font-body`, `--leading-normal` |
| Captions | Size, color, weight | `--font-caption`, `--color-muted-foreground` |
| Labels | Size, weight, case | `--font-label`, `--font-weight-medium` |

#### Typography Rules

1. Estimate font sizes: 12px (xs), 14px (sm), 16px (base), 18px (lg), 20px (xl), 24px (2xl), 30px (3xl)
2. Note if sans-serif (Inter/system), serif, or monospace
3. Check if headings use a different font family than body

### Step 5: Extract Component Patterns

| Component | Properties | Maps To |
|-----------|-----------|---------|
| Buttons | Corner radius, padding, variants | `--button-radius`, `--button-padding-*` |
| Cards | Radius, shadow, border, padding | `--card-radius`, `--card-shadow` |
| Inputs | Border style, radius, height | `--input-radius`, `--input-border` |
| Badges/Tags | Shape (pill/rounded/square) | `--badge-radius` |

#### Component Rules

1. Note the overall "roundness" — fully rounded (pill), moderately rounded, or sharp
2. Note shadow intensity — none, subtle, prominent
3. Note border usage — bordered vs borderless design

### Step 6: Generate Token JSON

Use the extracted values to populate `templates/design-tokens-starter.json`:

```json
{
  "primitive": {
    "color": {
      "brand": {
        "50": { "$value": "<extracted-lightest>", "$type": "color" },
        "500": { "$value": "<extracted-mid>", "$type": "color" },
        "600": { "$value": "<extracted-primary>", "$type": "color" },
        "700": { "$value": "<extracted-hover>", "$type": "color" }
      }
    }
  },
  "semantic": {
    "color": {
      "primary": { "$value": "{primitive.color.brand.600}", "$type": "color" }
    }
  }
}
```

## Output Format

After extraction, present findings as:

```
## Extracted Design Tokens

### Colors
- Primary: #XXXXXX (from buttons/links)
- Background: #XXXXXX (page bg)
- Foreground: #XXXXXX (body text)
- Border: #XXXXXX (dividers)
- [additional colors]

### Spacing
- Density: tight / normal / loose
- Base unit: 4px / 8px
- Component padding: ~Npx
- Section gap: ~Npx

### Typography
- Font family: [identified or "system sans-serif"]
- Body size: ~Npx
- Heading scale: [estimated sizes]
- Weight usage: [regular/medium/semibold/bold]

### Shape
- Corner radius: sharp / slightly rounded / rounded / pill
- Shadow usage: none / subtle / prominent
- Border style: bordered / borderless / mixed
```

## Confidence Levels

Mark each extraction with confidence:

- **High** — clearly visible, unambiguous
- **Medium** — visible but estimated, may need adjustment
- **Low** — inferred from context, user should confirm

Always ask the user to confirm low-confidence extractions before generating final tokens.

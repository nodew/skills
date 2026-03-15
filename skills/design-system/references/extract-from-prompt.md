# Extract Tokens from Text Prompt

Generate design tokens from natural language descriptions, brand briefs, or mood keywords.

## Input Types

| Input | Example | Extraction Strategy |
|-------|---------|-------------------|
| Mood keywords | "modern, clean, minimal" | Map to style presets |
| Brand description | "Fintech app for young professionals" | Industry + audience inference |
| Color preference | "Blue primary, warm neutrals" | Direct color mapping |
| Reference brand | "Similar to Stripe / Linear / Notion" | Known brand palette extraction |
| Brand brief | Full brand guideline document | Extract specified values |

## Extraction Workflow

### Step 1: Parse Input Intent

Identify which of these the user is providing:

1. **Explicit values** — "Primary color #3B82F6" → use directly
2. **Color words** — "Blue", "Warm", "Earth tones" → map to palette
3. **Mood/style** — "Minimal", "Bold", "Playful" → map to design attributes
4. **Industry** — "Healthcare", "Finance", "Creative" → use preset
5. **Reference brand** — "Like Stripe" → use known palette
6. **Audience** — "Enterprise", "Consumer", "Developer" → adjust density/tone

### Step 2: Map Mood to Design Attributes

| Mood | Radius | Shadow | Spacing | Colors | Typography |
|------|--------|--------|---------|--------|------------|
| Minimal | sm-md | subtle | generous | muted, monochrome | light weights |
| Bold | lg | prominent | tight | saturated, high contrast | heavy weights |
| Playful | xl-full | colorful | loose | bright, varied | rounded fonts |
| Corporate | sm | subtle | standard | blue/gray, conservative | standard weights |
| Elegant | none-sm | none | generous | dark, gold accents | serif headings |
| Tech/Dev | md | none-subtle | standard | dark bg, accent colors | monospace accents |
| Warm | lg | soft | comfortable | earth tones, warm grays | friendly fonts |
| Clean | md | minimal | airy | cool grays, single accent | system sans |

### Step 3: Map Industry to Color Ranges

Reference: `templates/brand-presets.json`

| Industry | Primary Range | Neutrals | Accent |
|----------|--------------|----------|--------|
| Finance/Fintech | Blue (#1E40AF–#3B82F6) | Cool gray | Green (success) |
| Healthcare | Blue-Green (#0D9488–#14B8A6) | Warm gray | Blue (trust) |
| E-commerce | Orange-Red (#EA580C–#F97316) | Neutral gray | Green (action) |
| SaaS/Productivity | Purple-Blue (#7C3AED–#8B5CF6) | Slate | Indigo |
| Education | Green-Teal (#059669–#10B981) | Warm gray | Blue |
| Creative/Design | Pink-Purple (#DB2777–#EC4899) | Zinc | Violet |
| Developer Tools | Slate bg (#0F172A) | Slate | Cyan/Green accent |
| Social | Blue (#2563EB) or brand-specific | Gray | Multiple accents |

### Step 4: Map Color Words to Hex Values

| Color Word | Primary | Hover | Light (50) |
|------------|---------|-------|------------|
| Blue | #2563EB | #1D4ED8 | #EFF6FF |
| Indigo | #4F46E5 | #4338CA | #EEF2FF |
| Violet | #7C3AED | #6D28D9 | #F5F3FF |
| Purple | #9333EA | #7E22CE | #FAF5FF |
| Pink | #DB2777 | #BE185D | #FDF2F8 |
| Red | #DC2626 | #B91C1C | #FEF2F2 |
| Orange | #EA580C | #C2410C | #FFF7ED |
| Yellow | #CA8A04 | #A16207 | #FEFCE8 |
| Green | #16A34A | #15803D | #F0FDF4 |
| Teal | #0D9488 | #0F766E | #F0FDFA |
| Cyan | #0891B2 | #0E7490 | #ECFEFF |
| Slate | #475569 | #334155 | #F8FAFC |

### Step 5: Resolve Reference Brands

For "like X" requests, use known palettes:

| Brand | Primary | Style | Radius | Notes |
|-------|---------|-------|--------|-------|
| Stripe | #635BFF | Clean, airy | md | Generous spacing, gradient accents |
| Linear | #5E6AD2 | Minimal, dark | lg | Dark mode default, violet accent |
| Notion | #000000 | Clean, neutral | sm | B&W with subtle accents |
| Vercel | #000000 | Bold, minimal | lg | High contrast, dark-first |
| Figma | #A259FF | Playful, colorful | xl | Multiple accent colors |
| Slack | #4A154B | Warm, friendly | lg | Purple primary, warm neutrals |
| GitHub | #24292F | Developer, clean | md | Dark header, light content |
| Tailwind | #06B6D4 | Modern, clean | lg | Cyan accent, code-friendly |
| shadcn/ui | #18181B | Minimal, system | md | Near-black primary, zinc scale |

### Step 6: Generate Color Scale

From the resolved primary color, generate the full scale:

```
Given primary = #2563EB (blue-600):

50:  lightest tint     → #EFF6FF  (background tint)
100: lighter tint      → #DBEAFE  (hover backgrounds)
200: light             → #BFDBFE  (borders, rings)
300: light-mid         → #93C5FD  (decorative)
400: mid               → #60A5FA  (icons, secondary)
500: medium            → #3B82F6  (standard weight)
600: primary           → #2563EB  (primary actions)  ← base
700: hover             → #1D4ED8  (hover state)
800: active            → #1E40AF  (active state)
900: dark              → #1E3A8A  (text on light)
```

### Step 7: Assemble Design Attributes

Combine all mappings into a unified spec:

```
Primary: [resolved color]
Neutral: [warm gray / cool gray / slate / zinc]
Radius: [none / sm / md / lg / xl / full]
Shadow: [none / subtle / default / prominent]
Density: [tight / standard / loose]
Typography: [system / rounded / serif / mono-accent]
Theme: [light-first / dark-first / both]
```

### Step 8: Generate Token JSON

Populate `templates/design-tokens-starter.json` with the resolved values.

## Example Conversations

**User:** "Design tokens for a fintech dashboard, modern and clean"

→ Industry: Finance → Blue primary
→ Mood: Modern + Clean → md radius, subtle shadows, standard spacing
→ Generate: Blue-600 primary, cool gray neutrals, md radius, subtle shadows

**User:** "Like Linear but with green accents"

→ Reference: Linear → dark mode, minimal, lg radius
→ Override: Primary = Green (#16A34A)
→ Generate: Green primary, dark-first theme, lg radius, no shadows

**User:** "Warm, friendly e-commerce site"

→ Mood: Warm → lg radius, soft shadows, earth tones
→ Industry: E-commerce → Orange action colors
→ Generate: Orange primary, warm gray neutrals, lg radius, soft shadows

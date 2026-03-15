# Agent Skills

A collection of skills for AI coding agents. Skills are packaged instructions and scripts that extend agent capabilities.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Available Skills

### design-system

Generate design tokens (theme colors, spacing, typography, components) from any input — screenshots, text prompts, brand briefs, or existing CSS. Uses a three-layer architecture (primitive → semantic → component). Supports light/dark themes, CSS variables, and Tailwind integration.

**Use when:**
- Creating design tokens (colors, spacing, typography, shadows, radius)
- Extracting design tokens from screenshots or existing UI
- Generating tokens from brand descriptions or mood keywords
- Extracting tokens from existing CSS/Tailwind codebases
- Component state definitions and variant specs
- CSS variable systems with light/dark themes
- Design-to-code handoff

**Key features:**
- Three-layer token architecture: Primitive → Semantic → Component
- W3C Design Tokens Community Group JSON format
- Light/dark theme switching via CSS custom properties
- Tailwind config generation
- Token validation scripts

### ui-prototype

Create UI prototypes for websites, dashboards, desktop apps, or mobile apps using HTML and TailwindCSS. Applies design system tokens before generating markup to ensure consistent theming.

**Use when:**
- Creating mockups, wireframes, or screen concepts
- Building previewable interface prototypes
- Designing mobile apps, web pages, or desktop applications
- Prototyping dashboards or SaaS interfaces

**Key features:**
- Design tokens first — grounded in `design-system` skill output
- Dual theme with light/dark mode toggle
- Platform inference (app / web / desktop)
- Realistic, domain-appropriate placeholder content
- WCAG AA accessibility compliance

## Installation

```bash
npx skills add zhifei/skills
```

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**
```
Generate design tokens from this screenshot
```
```
Create a mobile app prototype for a fitness tracker
```
```
Extract design tokens from my Tailwind config
```

## Skill Structure

Each skill contains:
- `SKILL.md` - Instructions for the agent
- `scripts/` - Helper scripts for automation (optional)
- `references/` - Supporting documentation (optional)
- `templates/` - Starter files and presets (optional)

## License

MIT

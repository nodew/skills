# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, Copilot, etc.) when working with code in this repository.

## Repository Overview

A collection of skills for AI coding agents. Skills are packaged instructions, references, scripts, and templates that extend agent capabilities for design system creation and UI prototyping.

## Creating a New Skill

### Directory Structure

```
skills/
  {skill-name}/           # kebab-case directory name
    SKILL.md              # Required: skill definition
    scripts/              # Optional: executable scripts
      {script-name}.cjs   # Node.js scripts
    references/           # Optional: supporting documentation
      {topic}.md          # Detailed reference material
    templates/            # Optional: starter files and presets
      {name}.json         # JSON templates
```

### Naming Conventions

- **Skill directory**: `kebab-case` (e.g., `design-system`, `ui-prototype`)
- **SKILL.md**: Always uppercase, always this exact filename
- **Scripts**: `kebab-case.cjs` or `kebab-case.sh`
- **References**: `kebab-case.md`

### SKILL.md Format

```markdown
---
name: {skill-name}
description: {One sentence describing when to use this skill. Include trigger phrases.}
argument-hint: "[optional argument description]"
---

# {Skill Title}

{Brief description of what the skill does.}

## When to Use

{Bulleted list of use cases}

## How It Works

{Numbered list or sections explaining the skill's workflow}
```

### Best Practices for Context Efficiency

Skills are loaded on-demand — only the skill name and description are loaded at startup. The full `SKILL.md` loads into context only when the agent decides the skill is relevant. To minimize context usage:

- **Keep SKILL.md under 500 lines** — put detailed reference material in separate files under `references/`
- **Write specific descriptions** — helps the agent know exactly when to activate the skill
- **Use progressive disclosure** — reference supporting files that get read only when needed
- **Prefer scripts over inline code** — script execution doesn't consume context (only output does)
- **File references work one level deep** — link directly from SKILL.md to supporting files

### Script Requirements

- Node.js scripts use `.cjs` extension with `#!/usr/bin/env node` or are invoked via `node`
- Bash scripts use `#!/bin/bash` shebang with `set -e` for fail-fast behavior
- Write status messages to stderr: `console.error("Message")` or `echo "Message" >&2`
- Write machine-readable output (JSON) to stdout
- Use only Node.js built-ins (`fs`, `path`) — no external dependencies

### Token Architecture Convention

Design tokens follow a three-layer architecture:
1. **Primitive** — raw values (hex colors, rem sizes)
2. **Semantic** — purpose-based aliases (`--color-primary`, `--spacing-md`)
3. **Component** — per-component overrides (`--button-bg`, `--input-border`)

This maps to W3C Design Tokens Community Group JSON format with `$value` and `$type` fields.

## Existing Skills

### logo-creator
Creates production-ready logo systems from text briefs, reference images, or both. Uses geometric construction principles and a structured generation pipeline (parse → conceptualize → typeface → lockups → build → export) to produce SVG vector logos with raster exports.

- Entry: `skills/logo-creator/SKILL.md`
- Scripts: `export-logo-assets.cjs` (lib: `export-logo-assets-lib.cjs`)
- References: `geometry.md`, `typography.md`, `lockups.md`, `modernism.md`

### subtitle-translator
Extracts embedded subtitle tracks from video files, translates them via subagents, and optionally remuxes translated subtitles back into the container. Supports MKV, MP4, MOV, M4V.

- Entry: `skills/subtitle-translator/SKILL.md`
- Scripts: `translate-video-subtitles.cjs`
- References: `subagent-translator-prompt.md`, `subagent-reviewer-prompt.md`, `container-toolchain.md`

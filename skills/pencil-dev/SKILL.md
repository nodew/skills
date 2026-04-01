---
name: pencil-dev
description: Design structured product prototypes in pencil.dev and .pen files with the Pencil MCP tools. Use this whenever the user asks to create, revise, theme, restyle, or implement a screen, flow, dashboard, landing page, mobile app, design system, or reusable component in pencil.dev or a .pen file. Reach for this skill even if the user only mentions prototype work, light and dark mode, design tokens, reusable UI, shared navigation or page shells, consistent interaction patterns, or implementing a design into code without explicitly naming pencil.dev.
argument-hint: "[design task, .pen file path, selected node, or implementation target]"
---

# Pencil Dev

Use the Pencil MCP tools to build prototypes that stay structured, reusable, and themeable as the design grows.

If a dedicated UI design system skill is available in the environment, use that skill first to establish or refine the design system, then use this skill to execute the work in pencil.dev with the Pencil MCP tools. If no such skill exists, perform the design-system work inline with this skill's token-first and component-first workflow.

## Core Principles

1. **Start with variables, not literals.**
   Treat typography, color, spacing, radius, shadow, and other repeated style decisions as part of a system. Reuse existing variables first, extend the variable set second, and fall back to raw values only when a variable genuinely cannot express the intent.

2. **Design light and dark together.**
   Do not finish a screen in one theme and defer the other. Put theme differences at the variable layer early so components and pages can inherit them cleanly.

3. **Extract reusable components before composing pages.**
   Look for repeated structures and stable UI patterns first. It is cheaper to promote a card, form row, nav item, modal shell, or table pattern into a reusable component before duplicating it across screens.

4. **Keep shared shells and interactions consistent across pages.**
   Navigation, sidebar, top bar, page header, filter bars, modal framing, and similar shared areas should not drift page by page. Abstract them into reusable components or layout shells so users do not experience different structure or interaction conventions on different screens.

5. **Treat structured objects as the source of truth.**
   When implementing from a .pen design into code or another artifact, inspect structured nodes, variables, instances, and layout data. Screenshots are for visual review only. Do not use screenshots to recover hierarchy, spacing, or token intent when structured data exists.

## Scope

Use this skill for five kinds of work:

1. Create a new prototype or screen in pencil.dev.
2. Extend an existing design system or component library inside a .pen file.
3. Add theme-aware pages that must support both light and dark presentation.
4. Keep multi-page products consistent by reusing shared shells and interaction patterns.
5. Implement a .pen design into code by reading structured objects instead of screenshot pixels.

If the user only has a screenshot and no structured source, treat the screenshot as a visual reference and say explicitly that hierarchy, spacing, and token mapping are being inferred with lower confidence.

## Workflow

### 1. Establish context

- Call `mcp_pencil_get_editor_state` first when the active .pen file, selection, or schema context is unclear.
- If there is no open document, use `mcp_pencil_open_document` to open the requested file or create a new document.
- Route the task before editing: design system composition, web app screen, mobile app screen, landing page, table-heavy layout, or code handoff.
- If the environment exposes a specialized UI design system skill, load and apply it before building pages so tokens, component contracts, and shared patterns are defined at the system layer first.
- Load only the relevant guidance with `mcp_pencil_get_guidelines`, such as `design-system`, `web-app`, `mobile-app`, `landing-page`, `slides`, `table`, `code`, or `tailwind`.
- For additional design inspiration, use `mcp_pencil_get_style_guide_tags` to discover available tags, then `mcp_pencil_get_style_guide` to load a style guide by tags or name.

### 2. Audit variables and themes first

- Use `mcp_pencil_get_variables` to inspect the current token and theme model.
- If the file has no usable system yet, define one early with `mcp_pencil_set_variables`.
- Prioritize variable-backed decisions for at least these groups when they appear in the design:
  - typography scales
  - text and surface colors
  - spacing and layout gaps
  - radius, borders, and shadows
  - common sizing primitives when the product uses them repeatedly
- Encode light and dark values at the variable layer instead of scattering theme overrides across page nodes.
- Reuse variables on components and screens instead of writing custom values directly on nodes whenever practical.
- If a raw value is unavoidable, keep it isolated and explain why it was necessary.

### 3. Audit reusable building blocks before page design

- Use `mcp_pencil_batch_get` to inspect the current document, especially reusable nodes, in as few calls as possible.
- Search for reusable components in one batch instead of reading components one by one.
- Identify repeated patterns before drawing full pages: navigation shells, cards, tables, filter bars, empty states, dialogs, form controls, list items, and section headers.
- Promote stable patterns into reusable components first, then instantiate them into pages.
- Prefer instance overrides and descendant updates over detached copies when the pattern is still meant to stay shared.

### 4. Compose screens from tokens and components

- Use `mcp_pencil_batch_design` in coherent batches that make structural progress.
- Prefer inserting or updating reusable component instances inside layout frames rather than drawing page-specific duplicates.
- Let layout containers, gaps, padding, and alignment carry structure where possible; do not overuse manual absolute positioning when the layout system can express the same intent.
- Keep visual decisions anchored to variables so the theme system stays maintainable.
- When adding new surfaces, text roles, or component states, make sure both light and dark themes remain legible.

### 5. Validate structurally, then visually

- Inspect node structure, instances, and variables with `mcp_pencil_batch_get` before relying on screenshots.
- Use `mcp_pencil_snapshot_layout` to catch clipping, overlap, and layout issues.
- Use `mcp_pencil_get_screenshot` after the structure is in place to verify polish, rhythm, and visual balance.
- Audit interaction conventions as part of the same pass: disclosure patterns, filter behavior, primary and secondary actions, table row actions, modal triggers, tab switching, and navigation affordances should feel like one product rather than separate page experiments.
- For implementation or handoff work, read structured objects and variables as the implementation source of truth. Use screenshots only to confirm the final look.

## Tool Routing

| Tool | Purpose |
|------|---------|
| `mcp_pencil_get_editor_state` | First context check for active file, selection, and schema |
| `mcp_pencil_open_document` | Open an existing .pen file or create a new one |
| `mcp_pencil_get_guidelines` | Task-specific design guidance |
| `mcp_pencil_get_style_guide_tags` | Discover available style guide tags for design inspiration |
| `mcp_pencil_get_style_guide` | Load a style guide by tags or name |
| `mcp_pencil_get_variables` / `mcp_pencil_set_variables` | Token and theme definition |
| `mcp_pencil_batch_get` | Inspect components, node trees, and structured design data |
| `mcp_pencil_batch_design` | Create and update components and screens |
| `mcp_pencil_find_empty_space_on_canvas` | Find available canvas space for placing new content |
| `mcp_pencil_snapshot_layout` | Structural layout QA |
| `mcp_pencil_get_screenshot` | Visual QA only, never the primary source of structure |
| `mcp_pencil_search_all_unique_properties` | Search unique property values across node trees |
| `mcp_pencil_replace_all_matching_properties` | Batch replace matching property values across node trees |
| `mcp_pencil_export_nodes` | Export nodes to images in PNG/JPEG/WEBP/PDF formats |

## Post-Task Summary

After completing a task, report:

1. Which variable groups were reused or introduced.
2. Whether a dedicated UI design system skill was leveraged first, or whether the design-system work was handled inline.
3. How light and dark theme support was handled.
4. Which reusable components or shared shells were created, reused, or expanded.
5. How cross-page structure and interaction consistency were preserved.
6. What page or screen changes were made.
7. Whether validation used structure, screenshots, or both.
8. Any remaining raw values or one-off overrides, with reason.

## Checklist

- [ ] Typography, color, spacing, and other repeated style choices are variable-backed where practical.
- [ ] A dedicated UI design system skill was used first when one is available.
- [ ] Light and dark values exist together at the variable layer.
- [ ] Reusable components were considered before composing final pages.
- [ ] Repeated UI patterns were extracted instead of copied blindly.
- [ ] Shared navigation, sidebar, top bar, and page-shell patterns stay aligned across screens.
- [ ] Interaction conventions are consistent across comparable flows and components.
- [ ] Structured nodes, instances, and variables were used as the implementation source of truth.
- [ ] Screenshots were used only for review, not for measuring hierarchy or spacing when structured data existed.
- [ ] Any remaining raw values are intentional and explained.

## Anti-Patterns

- Hard-coding font sizes, colors, spacing, or radius values across page nodes
- Skipping an available UI design system skill and jumping straight into page assembly
- Finishing light mode first and promising dark mode later
- Drawing several similar page fragments before checking whether they should be a component
- Reading screenshots to infer node hierarchy, spacing, or token usage when the .pen structure is available
- Breaking shared components into detached copies just to make small page-specific tweaks
- Letting shared navigation, sidebars, top bars, or other page-shell regions drift into different visual structures across screens
- Mixing interaction styles for the same kind of action or state across different pages without a strong reason
- Mixing token-driven styling with arbitrary literals without a clear reason

## Examples

**Example 1:**
Input: "Design a SaaS analytics dashboard in pencil.dev with summary cards, a chart area, a recent alerts panel, and both light and dark themes."
Output: Inspect editor state and variables first, define or extend typography, color, and spacing tokens with light and dark values, extract reusable cards and panel shells, then compose the dashboard from component instances.

**Example 2:**
Input: "Implement this existing .pen settings screen in code."
Output: Read structured nodes, instances, variables, and layout data from the .pen file, load code guidance if implementation is requested, and use screenshots only to visually verify the final output.
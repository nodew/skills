# Desktop Guidelines

Use this file when the target platform is `desktop`.

Treat the output as a software workspace, not a marketing page.

## Layout

- Full-width adaptive shell — no centered content column.
- Typical structure: left sidebar (200–280px) + top toolbar + main content area + optional right inspector (240–320px).
- Support higher information density than mobile or marketing web.
- Design for mouse-and-keyboard workflows with persistent workspace structure.
- Use `h-screen` with `overflow-hidden` on the body; let individual panes scroll independently.

## Shared shell

- Sidebars, toolbars, inspectors, and status bars must remain visually stable across views.
- Only selected state, workspace title, local tool actions, and active panels change between pages.
- Shell changes only for explicitly different modes (setup, login, full-screen canvas).
- Related pages should read as one application, not separate websites.

## UI patterns

- Data tables with sortable headers, row selection, inline actions.
- Tree views / file lists in sidebars.
- Split panes (list + detail).
- Control strips and toolbar buttons with icon + optional label.
- Detail inspectors / property panels.
- Status bars with contextual information.
- Modal and non-modal dialogs.
- Make hierarchy clear through grouping, dividers, and spacing — not oversized blocks.

## Theme specifics

- Light: `bg-gray-50` workspace background, `bg-white` panels, `border-gray-200` dividers.
- Dark: `bg-gray-950` workspace background, `bg-gray-900` panels, `border-gray-800` dividers.
- Toolbar: `bg-gray-100 dark:bg-gray-900` with subtle bottom border.
- Active sidebar item: `bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300`.
- Keep panel relationships and focus states consistent between themes.

## Responsiveness

- Adaptive across laptop (1280px) and wide desktop (1920px+).
- On narrower widths, collapse the right inspector first, then hide the left sidebar behind a toggle.
- Keep primary workspace tools visible as long as possible.
- Do not convert to a phone-style layout — maintain the desktop paradigm.

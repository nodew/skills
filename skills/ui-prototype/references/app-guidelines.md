# App Guidelines

Use this file when the target platform is `app`.

Treat the output as a mobile product surface previewed inside a desktop browser.

## Layout

- Center a phone frame in the browser viewport with a subtle device border or shadow.
- Fixed-width canvas: **430px** (iPhone 17 Pro Max proportions).
- Wrap the phone frame in a centered container with a neutral background (`bg-gray-100 dark:bg-gray-900`).
- All content lives inside the phone frame — do not let app UI spill outside it.

## Shared shell

- Reuse the same top bar, bottom tab bar, and sheet patterns across screens.
- Only the active tab indicator, screen title, and local actions should differ between pages.
- Break the shell only for distinct modes the user explicitly requests (onboarding, auth, full-screen capture).

## UI patterns

- Top bars with back button / title / action.
- Bottom tab bars (3–5 tabs).
- Cards, lists, sheets, segmented controls.
- Primary action buttons within thumb-friendly reach.
- Min touch target: **44px**.
- Avoid multi-column layouts — single column with clear vertical rhythm.

## Theme specifics

- Phone frame background: `bg-white dark:bg-gray-950`.
- Use higher elevation (shadow) for sheets and modals in light mode; use lighter surface colors in dark mode.
- Status bar area: light text on dark backgrounds, dark text on light backgrounds.

## Responsiveness

- The phone canvas width is fixed at ~430px.
- The outer browser preview adapts — center the phone in the viewport.
- Internal app layout does not change with browser width.

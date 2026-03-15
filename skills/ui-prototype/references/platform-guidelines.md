# Platform Guidelines

Cross-platform rules to review before reading the platform-specific reference.

## Theme implementation

Use Tailwind's class-based dark mode strategy:

```html
<html class="dark">
```

```js
// Minimal theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
});
```

Style both themes using Tailwind's `dark:` prefix on the same elements. Do not create separate HTML files for light and dark — both themes live in one file.

## Multi-page shell consistency

When producing multiple pages:

- Shared shell regions (navigation, top bars, sidebars, bottom bars) should be structurally identical across pages.
- Copy-paste the shell HTML between files; only change active state indicators, page title, breadcrumbs, and page-specific content.
- Break the shared shell only for explicitly different modes (auth, onboarding, full-screen editing).

## Typography baseline

- Use a clean sans-serif stack: `font-family: 'Inter', system-ui, sans-serif`. Load Inter from Google Fonts when it fits the design.
- Establish a clear type scale — use Tailwind's built-in sizes (`text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.) consistently.

## Icons

- Use [Lucide](https://lucide.dev) icons via CDN for general-purpose UI icons.
- Inline SVG is acceptable for small icon sets.
- Always pair icon-only buttons with `aria-label`.

## Which platform file to read next

- `app-guidelines.md` — mobile app surfaces inside a phone frame
- `web-guidelines.md` — browser-based sites and dashboards
- `desktop-guidelines.md` — desktop software workspaces

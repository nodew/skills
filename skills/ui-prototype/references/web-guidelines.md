# Web Guidelines

Use this file when the target platform is `web`.

Treat the output as a browser-native experience that stretches and contracts naturally across viewports.

## Layout

- Use `max-w-7xl mx-auto` as the default content container.
- Prefer clear section structure: hero, features, content area, footer.
- For dashboards: sidebar + main content area with header.
- Match the shell to the domain — do not force a generic marketing layout on a SaaS dashboard.

## Shared shell

- Navigation, header, footer, and component styling must be consistent across pages.
- Reuse the same spacing scale, type hierarchy, card language, and control styling.
- Only active nav state, page heading, breadcrumbs, and local actions change between pages.
- Reserve shell changes for genuine context shifts (marketing vs authenticated areas).

## UI patterns

- **Marketing / landing:** Hero sections, feature grids, testimonials, pricing tables, CTAs, footers.
- **Dashboard / SaaS:** Side navigation, data cards, tables, charts (placeholder), form sections.
- **Content / blog:** Article layout, reading-width containers (`max-w-prose`), related content sidebars.
- Match patterns to the user's domain instead of using generic filler.

## Theme specifics

- Light: `bg-white` body, `bg-gray-50` section alternation, dark text.
- Dark: `bg-gray-950` body, `bg-gray-900` section alternation, light text.
- Borders: `border-gray-200 dark:border-gray-800`.
- Cards: `bg-white dark:bg-gray-900` with subtle shadow in light, subtle border in dark.
- Preserve the same information architecture across both themes.

## Responsiveness

- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`.
- Collapse multi-column layouts to single column on mobile.
- Navigation: full nav on desktop, hamburger menu on mobile.
- Rebalance spacing and type scale across breakpoints.
- Preserve content hierarchy as layout compresses.

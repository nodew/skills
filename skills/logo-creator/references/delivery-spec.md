# Delivery Specification

Use this reference to decide what to ship by default.

## Default Variants

Ship these when they make sense for the brand system:

- `primary`: the main approved logo lockup
- `mark`: icon-only or symbol-only version
- `wordmark`: text-only version when the brand name is part of the system
- `horizontal`: side-by-side lockup for headers and navigation
- `vertical`: stacked lockup for square or centered placements

If a variant is omitted, say why.

## Default Formats

### SVG

Always prefer SVG as the editable master.

### PNG

Use transparent backgrounds for the general-purpose exported raster assets.

Suggested sizes:

- `mark`: 16, 32, 48, 64, 128, 256, 512, 1024
- `primary`, `horizontal`, `vertical`, `wordmark`: 512 and 1024 minimum, plus other sizes if requested

### JPG

Use a solid background when exporting JPG.

Default background:

- white unless the user requests a brand color or dark background package

If the local export toolchain cannot flatten transparency onto the requested color, keep the JPG export behavior honest: use white when supported or skip the JPG and report the limitation.

### Favicon

Default favicon package should include:

- `favicon.ico`
- `favicon-16.png`
- `favicon-32.png`
- `favicon-48.png`

Prefer the `mark` variant for favicon generation.

## Delivery Tree

Recommended structure:

```text
logos/
  primary/
    brand-primary.svg
    brand-primary-512.png
    brand-primary-1024.png
    brand-primary-1024.jpg
  mark/
    brand-mark.svg
    brand-mark-16.png
    brand-mark-32.png
    brand-mark-48.png
    brand-mark-64.png
    brand-mark-128.png
    brand-mark-256.png
    brand-mark-512.png
    brand-mark-1024.png
    brand-mark-1024.jpg
    favicon.ico
    favicon-16.png
    favicon-32.png
    favicon-48.png
  wordmark/
  horizontal/
  vertical/
  export-manifest.json
```

## Delivery Notes

When finishing, explain:

- which file is the editable source of truth
- which assets are optimized for favicon or app-icon use
- what background was used for JPG exports
- any missing exports and why they were skipped
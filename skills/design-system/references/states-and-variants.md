# States and Variants

Component state definitions and variant patterns.

## Interactive States

### State Definitions

| State | Trigger | Visual Change |
|-------|---------|---------------|
| default | None | Base appearance |
| hover | Mouse over | Slight color shift |
| focus | Tab/click | Focus ring |
| active | Mouse down | Darkest color |
| disabled | disabled attr | Reduced opacity |
| loading | Async action | Spinner + opacity |

### State Priority

When multiple states apply, priority (highest to lowest):

1. disabled
2. loading
3. active
4. focus
5. hover
6. default

### State Transitions

```css
/* Standard transition for interactive elements */
.interactive {
  transition-property: color, background-color, border-color, box-shadow;
  transition-duration: var(--duration-fast);
  transition-timing-function: ease-in-out;
}
```

| Transition | Duration | Easing |
|------------|----------|--------|
| Color changes | 150ms | ease-in-out |
| Background | 150ms | ease-in-out |
| Transform | 200ms | ease-out |
| Opacity | 150ms | ease |
| Shadow | 200ms | ease-out |

## Focus States

### Focus Ring Spec

```css
/* Standard focus ring */
.focusable:focus-visible {
  outline: none;
  box-shadow: 0 0 0 var(--ring-offset) var(--color-background),
              0 0 0 calc(var(--ring-offset) + var(--ring-width)) var(--ring-color);
}
```

| Property | Value |
|----------|-------|
| Ring width | 2px |
| Ring offset | 2px |
| Ring color | primary (blue-500) |
| Offset color | background |

### Focus Within

```css
/* Container focus when child is focused */
.container:focus-within {
  border-color: var(--color-ring);
}
```

## Disabled States

### Visual Treatment

```css
.disabled {
  opacity: var(--opacity-disabled); /* 0.5 */
  pointer-events: none;
  cursor: not-allowed;
}
```

| Property | Disabled Value |
|----------|----------------|
| Opacity | 50% |
| Pointer events | none |
| Cursor | not-allowed |
| Background | muted |
| Color | muted-foreground |

### Accessibility

- Use `aria-disabled="true"` for semantic disabled
- Use `disabled` attribute for form elements
- Maintain sufficient contrast (3:1 minimum)

## Loading States

### Spinner Placement

| Component | Spinner Position |
|-----------|------------------|
| Button | Replace icon or center |
| Input | Trailing position |
| Card | Center overlay |
| Page | Center of viewport |

### Loading Treatment

```css
.loading {
  position: relative;
  pointer-events: none;
}

.loading::after {
  content: '';
  /* spinner styles */
}

.loading > * {
  opacity: 0.7;
}
```

## Error States

### Visual Indicators

```css
.error {
  border-color: var(--color-error);
  color: var(--color-error);
}

.error:focus-visible {
  box-shadow: 0 0 0 2px var(--color-background),
              0 0 0 4px var(--color-error);
}
```

### Error Message Pattern

```html
<div class="input-group">
  <label for="email">Email</label>
  <input id="email" class="error" aria-describedby="email-error" />
  <p id="email-error" role="alert">Please enter a valid email address</p>
</div>
```

## Variant Patterns

### Color Variants

Map each variant to semantic tokens:

```css
/* Variant: default */
.variant-default { background: var(--color-primary); color: var(--color-primary-foreground); }

/* Variant: secondary */
.variant-secondary { background: var(--color-secondary); color: var(--color-secondary-foreground); }

/* Variant: destructive */
.variant-destructive { background: var(--color-destructive); color: var(--color-destructive-foreground); }

/* Variant: outline */
.variant-outline { background: transparent; border: 1px solid var(--color-border); color: var(--color-foreground); }

/* Variant: ghost */
.variant-ghost { background: transparent; color: var(--color-foreground); }
```

### Size Variants

Use consistent size scale:

| Size | Height | Padding | Font | Radius |
|------|--------|---------|------|--------|
| xs | 24px | 4px 8px | 12px | sm |
| sm | 32px | 6px 12px | 14px | md |
| md | 40px | 8px 16px | 14px | md |
| lg | 48px | 12px 24px | 16px | lg |
| xl | 56px | 16px 32px | 18px | lg |

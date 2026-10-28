## Material Angular Theming

In `theme-colors.scss`, our Material Angular theme is defined. Surfaces are warm near-blacks and gold is the single accent (both `primary` and `tertiary` map to it), so the overall color scheme is like a bee's.

### Where things live

- **`src/styles.css`** is the source of truth for design tokens (`--color-*`, `--font-*`, `--radius-*`, `--shadow-*`, `--ease-out`, `--dur-*`) plus shared utilities. Prefer these in component CSS.
- **`theme-colors.scss`** mirrors the surface ladder into Material's system variables and sets component overrides (form fields, buttons, cards, selects, menus…) so Material components match hand-written ones.
- **`src/app/shared/chart-theme.ts`** is the AG Charts theme. Charts draw to canvas and can't read CSS variables, so it repeats the hex values; keep it in step with `styles.css`.

### Depth

Three surface tones plus one shadow, no glow or gradients: page ground `--color-bg` < cards `--color-surface` < hover `--color-surface-hover` < raised/selected `--color-surface-raised`. Inputs and summaries inside a card are inset wells (`--color-well`, same as the ground). Cards use `--shadow-card`.

### Shape

Small radii: 6px on controls (`--radius-control`), 8px on wells (`--radius-well`), 10px on cards (`--radius-card`). This replaced the earlier all-square corners.

### Type

Geist for UI, Geist Mono for every price, quantity, ID and timestamp (add `class="num"`). Headings use negative tracking; small section labels use `class="eyebrow"` (11px, uppercase, +0.1em).

### Motion

One curve (`--ease-out`, fast start and soft settle), 120–420ms. Use `.rise` for an element entering and `.stagger` on a parent to cascade its children. Route changes cross-fade through the router's view transitions. Everything is switched off under `prefers-reduced-motion`.

To use a Material color variable, use `var(--mat-sys-<name>)`, where `<name>` could be something like `tertiary` or `on-tertiary` (for text that is meant to be on a surface of tertiary color). For new code, prefer the `--color-*` tokens.

For more information on Angular components etc, see [Getting Started](https://material.angular.dev/guide/getting-started).


### Material Color Shortcuts

/* Primary */
--mat-sys-primary
--mat-sys-on-primary
--mat-sys-primary-container
--mat-sys-on-primary-container
--mat-sys-primary-fixed
--mat-sys-on-primary-fixed
--mat-sys-on-primary-fixed-variant
--mat-sys-primary-fixed-dim
--mat-sys-inverse-primary

/* Secondary */
--mat-sys-secondary
--mat-sys-on-secondary
--mat-sys-secondary-container
--mat-sys-on-secondary-container
--mat-sys-secondary-fixed
--mat-sys-on-secondary-fixed
--mat-sys-on-secondary-fixed-variant
--mat-sys-secondary-fixed-dim

/* Tertiary */
--mat-sys-tertiary
--mat-sys-on-tertiary
--mat-sys-tertiary-container
--mat-sys-on-tertiary-container
--mat-sys-tertiary-fixed
--mat-sys-on-tertiary-fixed
--mat-sys-on-tertiary-fixed-variant
--mat-sys-tertiary-fixed-dim

/* Error */
--mat-sys-error
--mat-sys-on-error
--mat-sys-error-container
--mat-sys-on-error-container

/* Surface */
--mat-sys-surface
--mat-sys-on-surface
--mat-sys-on-surface-variant
--mat-sys-surface-bright
--mat-sys-surface-container
--mat-sys-surface-container-high
--mat-sys-surface-container-highest
--mat-sys-surface-container-low
--mat-sys-surface-container-lowest
--mat-sys-surface-dim
--mat-sys-surface-tint
--mat-sys-surface-variant
--mat-sys-inverse-surface
--mat-sys-inverse-on-surface

/* Miscellaneous */
--mat-sys-background
--mat-sys-on-background
--mat-sys-neutral-variant20
--mat-sys-neutral10
--mat-sys-outline
--mat-sys-outline-variant
--mat-sys-scrim
--mat-sys-shadow
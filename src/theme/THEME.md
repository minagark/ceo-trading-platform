## Material Angular Theming

In `theme-colors.scss`, our Material Angular theme is defined. The primary color is a very dark gray, and the secondary color is lighter than that. The tertiary (previously known to Material as "accent") color is gold, so the overall color scheme is like a bee's. 

Material, by default, puts rounded corners on the vast majority of components, but currently our theme has only sharp corners, which we believe feels more like a sleek trading platform than the rounded corners. 

To use a color variable defined in `theme-colors.scss`, use the CSS variable `var(--mat-sys-<name>)`, where `<name>` could be something like `tertiary` or `on-tertiary` (for text that is meant to be on a surface of tertiary color).

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
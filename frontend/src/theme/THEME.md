## Material Angular Theming

In `theme-colors.scss`, our Material Angular theme is defined. The primary color is a very dark gray, and the secondary color is lighter than that. The tertiary (previously known to Material as "accent") color is gold, so the overall color scheme is like a bee's. 

Material, by default, puts rounded corners on the vast majority of components, but currently our theme has only sharp corners, which we believe feels more like a sleek trading platform than the rounded corners. 

To use a color variable defined in `theme-colors.scss`, use the CSS variable `var(--mat-sys-<name>)`, where `<name>` could be something like `tertiary` or `on-tertiary` (for text that is meant to be on a surface of tertiary color).
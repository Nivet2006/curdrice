# Feature Update: Dark Mode UX & Contrast Refinement

**Date:** 2026-03-22
**Component:** `app/globals.css`

## Issue
1. **Low Contrast on Accents**: In dark mode, buttons and containers with hardcoded high-contrast backgrounds (like `bg-[#0a0a0a]`) were causing nested text to become invisible or low-contrast.
2. **Card/Modal Legibility**: Text within components using legacy white background utilities (`bg-[#ffffff]`) was not correctly switching to optimized dark-mode foreground colors.
3. **Interactive Control Inconsistency**: Native `button`, `input`, and `select` elements were not fully synchronized with the new theme variables, leading to a mismatched UI on auth pages.

## Resolution
1. **Recursive Color Overrides**: Implemented aggressive `*` selectors on localized background containers. This forces all children within high-accent or card containers to inherit the correct semantic foreground colors (`var(--accent-fg)` or `var(--fg)`) regardless of hardcoded Tailwind utilities.
2. **Interactive Element Standardization**: 
   - Applied site-wide dark mode styling to all interactive controls.
   - Fixed visibility for transparent buttons and those with hardcoded border colors.
3. **Theme Clean-up**: Removed legacy `.text-white` overrides which were interfering with more specific theme logic.

## Environment Reset
A full environment reset (`taskkill`) was executed to refresh the global stylesheet bundle.

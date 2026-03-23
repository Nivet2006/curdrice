# Feature Update: Dark Mode Red-Alert Contrast Refinement

**Date:** 2026-03-22
**Component:** `app/globals.css`

## Issue
Error messages, password verification warnings, and destructive action buttons using the standard `bg-[#ffeded]` (light red) and `text-[#eb4b4b]` (dark red) colors were causing significant contrast issues in dark mode. The bright background was jarring against the dark theme, and the specific red tones lacked sufficient pop.

## Resolution
1. **Themed Error Tokens**: Implemented specific overrides for hex-based Tailwind red utility classes when inside a `[data-theme="dark"]` parent.
2. **Optimized Legibility**: 
   - Shifted harsh light-red backgrounds to deep muted tones (`#3d0a0a`).
   - Replaced dark red text with high-visibility vibrant red (`#ff6b6b`).
   - Reinforced border contrast using deep garnet (`#7f1d1d`).

## Environment Reset
A full environment reset (`taskkill`) was executed to refresh the global stylesheet.

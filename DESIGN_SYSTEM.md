# Club-Eve Design System & Style Guide

This document defines the visual language, branding, and UI standards for **Club-Eve**. Adhere to these guidelines to ensure consistency and a premium aesthetic across all new components and features.

---

## 1. Design Philosophy
Club-Eve uses a **Premium Brutalist** aesthetic:
- **High Contrast**: Solid blacks (`#0a0a0a`) and pure whites (`#ffffff`).
- **Sharp Geometry**: Bold borders instead of soft shadows.
- **Modular Layouts**: Clear separation of concerns using cards and grids.
- **Dynamic Adaptability**: Fully theme-aware (Light/Dark) and pattern-integrated.

---

## 2. Color System
We primarily use CSS variables defined in `app/globals.css`. **Avoid hardcoded hex values** in components; use the semantic variables or Tailwind utility classes that map to them.

### Core Variables
| Variable | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `--bg` | `#ffffff` | `#0a0a0a` | Main page background |
| `--bg-subtle` | `#f5f5f5` | `#1a1a1a` | Secondary backgrounds, inputs |
| `--bg-card` | `#ffffff` | `#141414` | Inner card background |
| `--fg` | `#0a0a0a` | `#f5f5f5` | Primary text |
| `--fg-muted` | `#555555` | `#a0a0a0` | Secondary text, labels |
| `--fg-faint` | `#999999` | `#666666` | Placeholders, decorative text |
| `--border` | `#e0e0e0` | `#2a2a2a` | Default borders |
| `--accent` | `#0a0a0a` | `#f5f5f5` | Primary actions, bold elements |
| `--accent-fg` | `#ffffff` | `#0a0a0a` | Text on accent backgrounds |

---

## 3. Typography
Club-Eve relies on high-quality sans-serif and monospace fonts.

- **Primary Sans (Inter/Outfit)**: Used for body text, UI labels, and headings.
  - *Weights*: 400 (Regular), 600 (Semi-bold), 800 (Extra-bold).
- **Secondary Mono (Roboto Mono/JetBrains Mono)**: Used for status labels, USNs, timestamps, and technical metadata.
  - *Style*: Uppercase with letter spacing (`tracking-widest`).

### Heading Hierarchy
- `h1`: `text-3xl font-black tracking-tight`
- `h2`: `text-2xl font-bold tracking-tight`
- `p (mono)`: `font-mono text-sm tracking-tighter`

---

## 4. UI Components

### Cards
Cards should feel physical and grounded.
- **Light**: `bg-white border border-zinc-200 rounded-[2.5rem] shadow-sm`
- **Dark**: `dark:bg-black dark:border-zinc-800`
- **Brutalist Variation**: Use `border-2 border-black` for administrative/critical cards.

### Buttons
- **Primary**: `bg-[#0a0a0a] text-white hover:bg-zinc-800 rounded-xl transition-all`
- **Secondary (Outline)**: `border border-zinc-200 hover:border-black rounded-xl transition-all`
- **Destructive**: `text-[#eb4b4b] hover:bg-[#ffeded] dark:hover:bg-red-950/30`

### Badges & Status
Use highly descriptive pills for role/status identification.
- **Pill Style**: `rounded-full font-mono text-[10px] uppercase tracking-widest px-3 py-1`
- **Approved**: `bg-green-50 text-green-700 border-green-200`
- **Pending**: `bg-amber-50 text-amber-700 border-amber-200`
- **Rejected**: `bg-red-50 text-red-700 border-red-200`

---

## 5. Background Pattern System
The platform supports dynamic background patterns toggled via the `Navbar`.
- **System**: Uses `data-pattern` attribute on the `<html>` or `<body>` tag.
- **Available Patterns**: `grid`, `dots`, `cross`, `diagonal`, `waves`, `hexagon`, etc.
- **Grading**: Patterns use low-opacity strokes (`rgba(0,0,0,0.12)` in light, `rgba(255,255,255,0.08)` in dark) to remain subtle and not distract from content.

---

## 6. Implementation Best Practices
1. **Theme Awareness**: Always wrap hard-coded styles in `[data-theme="dark"]` overrides in `globals.css` or use the `dark:` prefix in Tailwind.
2. **Animation**: Use subtle transitions for interactivity.
   - `transition: background-color 0.2s ease, border-color 0.2s ease`
3. **Spacing**: Follow a strict 4px grid (e.g., `p-4`, `p-8`, `p-10`).
4. **Icons**: Use `Lucide-React` for all iconography. Keep strokes consistent (default `size={20}` or `size={16}`).

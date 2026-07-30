# The 1% Club Design System

> Version 1.0

## 1. Design Philosophy
The design language reflects continuous improvement, professionalism, ambition, and growth. Every interface should feel premium, minimal, modern, and focused.

### Core Principles
- Clarity over decoration
- Consistency over creativity
- Accessibility first
- Fast interactions
- Premium visual identity

---

# Brand Identity

## Motto
> One Percent Better, Every Day.

## Tagline
> Earn Your Edge.

### Brand Attributes
- Professional
- Trustworthy
- Aspirational
- Student-focused
- Modern

---

# Color System

## Primary Brand Colors

| Token | Hex | Usage |
|------|------|------|
| Peacock Blue | #003C5E | Primary brand |
| Emerald Plume | #007F6E | Success / Growth |
| Golden Crown | #FFB703 | Highlights |
| Sunset Glow | #E85D04 | CTA |
| Midnight Feather | #0D0D0F | Dark Background |

## Supporting Colors

| Token | Hex |
|------|------|
| Antique Gold | #8A5A00 |
| Ivory White | #F8F7F2 |
| Slate Gray | #A6A6A6 |
| Steel Gray | #5C6470 |
| Charcoal | #1A1A1C |

---

# Theme Specification

## Dark Theme

Background: #0D0D0F

Surface: #15171A

Card: #1A1D22

Border: rgba(255,255,255,.08)

Primary Text: #F8F7F2

Secondary Text: #B8BEC6

Accent: #FFB703

CTA: #E85D04

Success: #007F6E

---

## Light Theme

Background: #FFFFFF

Surface: #F7F8FA

Card: #FFFFFF

Border: #E6E8EC

Primary Text: #111827

Secondary Text: #6B7280

Primary Brand: #003C5E

Accent: #FFB703

CTA: #E85D04

---

# Semantic Colors

Primary
Secondary
Success
Warning
Danger
Info

Never use red as branding.

---

# Typography

## Headings

Cinzel

H1 64
H2 48
H3 36
H4 30
H5 24
H6 20

## Body

Montserrat / Inter

Large 18

Regular 16

Small 14

Caption 12

Line Height 1.6

---

# Spacing

Use an 8px spacing system.

4
8
16
24
32
40
48
64
80
96
128

---

# Border Radius

Small 8

Medium 12

Large 16

XL 24

Pill 999

---

# Shadows

Elevation 1

Elevation 2

Elevation 3

Glow for CTA only.

---

# Buttons

## Primary

Background Peacock Blue

Hover Emerald

Pressed Dark Blue

White Text

## Secondary

Outlined

## Ghost

Transparent

## CTA

Sunset Glow

---

# Inputs

Rounded 12

Height 48

Focus ring Peacock Blue

Error Red

Success Emerald

---

# Cards

Radius 16

Padding 24

Hover lift 4px

Subtle border

---

# Navigation

Sticky navbar

Glass blur allowed only in hero

Desktop height 72

Mobile 64

---

# Tables

Striped optional

Hover row highlight

---

# Badges

Primary

Success

Warning

Neutral

---

# Chips

Filter chips

Rounded full

---

# Alerts

Info

Success

Warning

Danger

---

# Toasts

Bottom right desktop

Top mobile

4 second timeout

---

# Modals

Max width 720

Backdrop blur

ESC closes

---

# Icons

Outline style

Rounded corners

2px stroke

---

# Illustrations

Growth

Stairs

Fingerprint

Light rays

Botanical curves

Minimal geometric shapes

---

# Gradients

Ocean Depth
#003C5E → #007F6E

Luxury Gold
#8A5A00 → #FFB703

Twilight Horizon
#003C5E → #E85D04

Subtle Glow
#007F6E → #0D0D0F

---

# Motion

200ms default

300ms cards

500ms page transitions

Ease-in-out

Respect prefers-reduced-motion

---

# Accessibility

Minimum contrast WCAG AA

Keyboard accessible

Visible focus states

Touch target 44px

---

# Responsive Breakpoints

Mobile 0-639

Tablet 640-1023

Laptop 1024-1279

Desktop 1280+

Wide 1536+

---

# CSS Variables

```css
:root{
--primary:#003C5E;
--secondary:#007F6E;
--accent:#FFB703;
--cta:#E85D04;
--bg:#ffffff;
--surface:#f7f8fa;
--text:#111827;
}

.dark{
--primary:#003C5E;
--secondary:#007F6E;
--accent:#FFB703;
--cta:#E85D04;
--bg:#0D0D0F;
--surface:#15171A;
--text:#F8F7F2;
}
```

# Tailwind Tokens

primary
secondary
accent
cta
surface
background

---

# Landing Page

Hero

Mission

Vision

Statistics

Tools

Events

Testimonials

Gallery

FAQ

CTA

Footer

---

# Dashboard

Sidebar

Topbar

Analytics

Profile

Certificates

Events

Leaderboard

Tools

Settings

---

# AI Tools

ATS Resume Checker

Resume Builder

Mock Interview

Cover Letter Generator

LinkedIn Analyzer

GitHub Analyzer

Career Roadmap

Skill Gap Analyzer

PDF Summarizer

Quiz Generator

---

# Do

Use whitespace

Maintain hierarchy

Use premium animations

Keep pages uncluttered

---

# Don't

Overuse gradients

Mix many fonts

Use bright backgrounds

Overanimate

---

# Versioning

v1.0 Initial Design System

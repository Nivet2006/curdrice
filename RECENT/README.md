# Public Club Showcase System - User & Developer Manual

Welcome to the **Public Club Showcase System** for Curdrice! This guide explains how the public showcase pages function, how custom URL slugs (`./$THIS_NAME_CAN_BE_CUSTOMISED`) work, how assigned admins can customize their showcase pages, and how developers can integrate with the system.

---

## 1. Core Concept & Features

Each club registered on Curdrice can have a dedicated public-facing showcase page accessible via a custom URL slug (e.g., `https://your-domain.com/c/techeon`, `https://your-domain.com/c/grafix`, `https://your-domain.com/c/robotics`).

### Highlights:
- **Customizable URL Slugs**: Assigned admins can change the slug at any time. When changed, all links sitewide pointing to the club update automatically.
- **Dedicated Public Navbar**:
  Navbar links: `HOME` | `ABOUT` | `EVENTS` | `TEAM` | `GALLERY` | `BLOGS` | `SURVEY` | `TOOLS`
- **100% Customizable Showcase Page Builder**:
  - Show/Hide any section.
  - Reorder sections with drag & drop or position index.
  - Edit every hero element, heading, paragraph, color scheme, and banner image.
  - Manage showcase items: Testimonials, Gallery images, Blogs/Announcements, Tools/Resources, Active Surveys.
- **Integrated Contact Form**: Direct inquiry form that sends messages to the club showcase admin inbox.

---

## 2. Managing Custom URL Slugs (`./$THIS_NAME_CAN_BE_CUSTOMISED`)

### How to change a club's URL slug:
1. Log in as an assigned **Club Admin**, **Teacher**, **HOD**, or **Super Admin**.
2. Navigate to **Club Showcase Manager** (`/dashboard/club-showcase` or via Club Manager).
3. Select your club and click on **URL & General Settings**.
4. Type your desired custom slug (e.g. `robotics-innovators`).
5. Click **Save Slug**. The system validates slug availability and instantly updates the route to `/c/robotics-innovators`.
6. Sitewide links (on student dashboards, events lists, and club directories) will now point to `/c/robotics-innovators` seamlessly!

---

## 3. Customizing the Showcase Page (100% Core Customizer)

The Visual Showcase Customizer empowers assigned admins to customize every element:

### A. Layout & Section Visibility
- Toggle section switches ON/OFF for `About`, `Events`, `Team`, `Gallery`, `Testimonials`, `Blogs`, `Surveys`, `Tools`, and `Contact`.
- Reorder section numbers to display `Gallery` before `Events`, or `Team` before `About`.

### B. Hero & Brand Styling
- **Accent Color Picker**: Choose primary and accent brand colors for buttons, badges, and highlights.
- **Hero Title & Subtitle**: Set custom punchy headlines and club taglines.
- **Banner Media**: Upload or link high-resolution background banners or videos.
- **CTA Buttons**: Customize button label text and link destinations (e.g., "Join Community", "Register for Event").

### C. Content Section Editors
- **About**: Custom rich text, vision statement, mission, and key stats counters (e.g., "50+ Events", "500+ Members").
- **Events**: Curate which upcoming and past events are highlighted on the public page.
- **Testimonials**: Add student and alumni reviews with avatar pictures and designations.
- **Gallery**: Upload event photos, tag categories (e.g., "Hackathons", "Workshops"), and reorder images.
- **Blogs**: Publish club announcements, tech articles, and recap blogs.
- **Surveys & Tools**: Add Google Form/survey links and shared learning resources/GitHub repos.
- **Contact Form Inbox**: View incoming inquiries submitted by public visitors with contact details and timestamp.

---

## 4. Developer & Database Reference

### Key Tables
- `public.clubs`: Stores `slug` (text, UNIQUE) and `assigned_admin_id` (uuid -> profiles).
- `public.club_showcase_configs`: Stores `theme_config`, `sections_order`, `sections_enabled`, `hero_data`, `about_data`, `contact_config`.
- `public.club_testimonials`: Stores client quotes.
- `public.club_gallery`: Stores showcase photos.
- `public.club_blogs`: Stores articles and announcements.
- `public.club_tools`: Stores curated resource links.
- `public.club_surveys`: Stores active survey links.
- `public.club_inquiries`: Stores contact form submissions.

### Routing & Link Generation Helper
```typescript
import { getClubPublicUrl } from '@/lib/utils/club-url'

// Example usage in site components:
const clubUrl = getClubPublicUrl(club) // returns "/c/custom-slug" or "/c/[club_id]"
```

---

## 5. Summary of Files in `RECENT/` Folder
- [SUMMARY.md](file:///c:/codingprojects/Curdrice/RECENT/SUMMARY.md): Executive overview and architecture breakdown.
- [TASK.md](file:///c:/codingprojects/Curdrice/RECENT/TASK.md): Step-by-step technical task checklist.
- [README.md](file:///c:/codingprojects/Curdrice/RECENT/README.md): Admin and developer user manual.

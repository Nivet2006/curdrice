# 📱 CLUB-EVE — ULTRA-DETAILED MOBILE RESPONSIVENESS IMPLEMENTATION PLAN

> **Goal**: Make every page, component, and layout of the Club-Eve platform pixel-perfect, ultra-responsive, and fully mobile-friendly across all screen sizes (320px → 1920px+).

---

## 🔍 AUDIT FINDINGS SUMMARY

### Current State
- **Global Layouts**: All role layouts (`student`, `teacher`, `cc`, `admin`, `manager`, `pr`, `hod`) use a shared pattern:
  ```tsx
  <main className="flex-1 w-full max-w-[1280px] mx-auto px-8 py-10">
  ```
  The padding `px-8` (32px) is **too large for mobile** — on 320–375px screens this leaves only ~256–311px of content width. Must become `px-4 sm:px-6 md:px-8`.

- **Navbar**: Has mobile hamburger + slide-in sidebar already. However, the right side gets very cramped on small screens (ThemeToggle + PatternPicker + Badge + User button + hamburger all in one row).

- **Tables**: `UserTable`, `StudentAttendanceClient`, `LogsPageClient` use HTML `<table>` without card-row fallback on mobile — they horizontally overflow.

- **Leaderboard Grid**: `GamificationSection` uses `grid-cols-[60px_1fr_120px_100px_120px]` — this fixed grid breaks badly on mobile.

- **Event Cards (StudentEventsView)**: Timeline layout has `w-[80px] md:w-[120px]` date column + timeline dot + card — the left column wastes precious mobile screen real estate.

- **Dashboard Horizontal Scroll**: `student/dashboard` uses `flex gap-6 overflow-x-auto` for registered events — needs better touch scroll indicators.

- **HackathonConfigPanel**: Dense two-column grid panels without proper mobile stacking.

- **LogsPageClient**: Contains `text-6xl font-black` heading + complex nested grids — completely overflows on mobile.

- **EveBot/MessagesPanel**: Floating panels need proper safe-area insets on mobile.

- **Login Page**: Header brand text uses `absolute top-6 left-8` / `right-8` — overflows on 320px screens.

- **BugReporterWidget**: Large overlay panel, needs mobile bottom-sheet treatment.

- **ShareEventButton**: Contains a complex share card with team member display — needs mobile rework.

- **PosterDesigner**: Canvas-based designer (137KB component) — completely non-functional on mobile.

- **QRDisplay**: Full-screen QR modal — mostly OK but needs safe area padding.

- **EventThread (Discord-style chat)**: Fixed height 560px, fixed-position picker — needs touch-optimized input handling.

- **StudentFeedbackTerminal**: Star rating buttons are `w-12 h-12` — fine but modal height might clip.

---

## 📐 BREAKPOINT STRATEGY

We'll use Tailwind's default breakpoints throughout:

| Breakpoint | Min Width | Target Devices |
|---|---|---|
| (default) | 0px | Small phones (320–374px) |
| `sm` | 640px | Large phones / small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |

### Mobile-First Rules to Follow
- All layouts default to **single column**
- `md:` unlocks two columns
- `lg:` / `xl:` unlocks three-column or wide desktop views
- Min touch target size: **44×44px** (iOS HIG standard)
- Font sizes: minimum **14px** body, **12px** for labels

---

## 🗂️ PHASE 1: GLOBAL FOUNDATION

### 1.1 — All Role Layouts (`px-8` → responsive padding)

**Files**:
- `app/student/layout.tsx`
- `app/teacher/layout.tsx`
- `app/admin/layout.tsx`
- `app/cc/layout.tsx`
- `app/manager/layout.tsx`
- `app/pr/layout.tsx`
- `app/hod/layout.tsx`

**Change**:
```tsx
// BEFORE
<main className="flex-1 w-full max-w-[1280px] mx-auto px-8 py-10">

// AFTER
<main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
```

### 1.2 — Navbar Mobile Right Side Overflow

**File**: `components/shared/Navbar.tsx`

**Issues**:
- `ThemeToggle + PatternPicker + Badge + UserButton + Hamburger` all in one flex row → overflows on 320px
- `PatternPicker` has no display restriction on mobile
- `BrandMark` is always visible

**Changes**:
- Hide `PatternPicker` on mobile (`hidden sm:block`)
- Make role `Badge` hidden on mobile (`hidden sm:flex`)
- Reduce `px-3 py-1.5` on user button to `px-2 py-1` on mobile
- Add `flex-shrink-0` to hamburger button
- Cap the navbar right gap: `gap-1 sm:gap-2 md:gap-3`

### 1.3 — globals.css: Add Mobile-Friendly Global Rules

**File**: `app/globals.css`

Add:
```css
/* ── Mobile touch improvements ── */
@media (max-width: 768px) {
  button, a[role="button"], [role="button"] {
    -webkit-tap-highlight-color: transparent;
  }
  /* Prevent content from overflowing the viewport */
  body {
    overflow-x: hidden;
  }
}

/* ── Safe area insets (for notched phones) ── */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}
```

---

## 🗂️ PHASE 2: AUTH PAGES

### 2.1 — Login Page

**File**: `app/(auth)/login/page.tsx`

**Issues**:
- `absolute top-6 left-8` brand text overflows on narrow screens
- `absolute top-6 right-8` buttons collide with brand on 320px
- Test credentials panel `fixed bottom-6 right-6` could clip content

**Changes**:
- Replace absolute top items with a proper flex header row: `flex items-center justify-between px-4 py-4 sm:px-8`
- Ensure `max-w-sm w-full` card has `px-5 py-8 sm:px-8 sm:py-10` padding
- Test creds panel: add `max-w-[280px]` to prevent overflow on narrow screens

### 2.2 — Register Page

**File**: `app/(auth)/register/page.tsx` (to be audited similarly)

---

## 🗂️ PHASE 3: STUDENT ROLE PAGES

### 3.1 — Student Dashboard (`/student/dashboard`)

**File**: `app/student/dashboard/page.tsx`

**Issues**:
- Header row: `flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4` — `mb-12` is excessive on mobile
- Three badge spans `department/sem/year` in a `flex gap-2` — wraps OK but could overflow on very narrow
- "You're Going" horizontal scroll section: `min-w-[300px] w-[350px]` cards — too wide for mobile in single column

**Changes**:
- `mb-12` → `mb-6 md:mb-12`
- EventCard min-width: `min-w-[260px] w-[300px] sm:w-[350px]`
- Add `scrollbar-hide` and touch scroll momentum class

### 3.2 — Student Events Page (`/student/events`)

**File**: `components/student/StudentEventsView.tsx`

**Issues**:
- Timeline layout with `w-[80px] md:w-[120px]` date column: on 320px this is ~25% of viewport for just the date label
- Event cards: `flex flex-col md:flex-row gap-6` — poster image stacks below on mobile which is fine, but needs better ordering (poster should be at TOP on mobile, like a proper media card)
- Button bar `flex items-center justify-between gap-4 mt-6` can get tight with many buttons

**Changes**:
- Date column: `w-[64px] md:w-[100px]` with smaller text size on mobile
- Event card poster: move to top on mobile with `order-first md:order-last`
- Make poster height on mobile: `h-[160px] w-full md:w-[130px] md:h-[130px]`
- Title text: `text-base md:text-xl` (reduce from `lg md:xl`)
- Search bar: `w-full md:w-[280px]`
- Tabs toggle: ensure minimum touch target height of 44px

### 3.3 — Student Event Detail Page (`/student/events/[id]`)

Need to audit this page specifically — contains:
- EventThread (Discord chat - 560px height fixed)
- TeamFormationPortal
- HackathonConfigPanel
- StudentFeedbackTerminal

**EventThread Mobile Changes**:
- Height: `h-[560px]` → `h-[calc(100vh-200px)] md:h-[560px]` (fills more screen on mobile)
- Reaction picker: ensure `absolute right-2 -top-8` doesn't clip outside viewport on mobile
- Input bar: increase `py-2` to `py-3` for better touch target
- Message hover actions: on mobile use `group-hover:opacity-100` won't work (no hover) — make actions always visible on mobile with `opacity-100 md:opacity-0 md:group-hover:opacity-100`

### 3.4 — TeamFormationPortal

**File**: `components/student/TeamFormationPortal.tsx`

**Issues**:
- Search + invite forms: need full-width inputs on mobile
- Join requests list: compact layout that may overflow
- Team member list actions: buttons stack weirdly

**Changes**:
- All card sections: `p-4 md:p-6`
- Buttons: ensure minimum height 44px
- Member invite search: `w-full` input

### 3.5 — Student Attendance Page (`/student/attendance`)

**File**: `components/student/StudentAttendanceClient.tsx`

**Issues**:
- Full HTML `<table>` with 5 columns — COMPLETELY breaks on mobile screens
- Table header: `Event Name | Organized By | Event Date | Status | Checked In At` — all 5 cols cannot fit

**Changes**: Convert table to card-row layout on mobile:
```
MOBILE (< md):  Each row becomes a card with:
  - Event Name (bold, large)
  - Club Name badge
  - Date + Status in a row
  - Checked In At timestamp

DESKTOP (>= md): Keep original table
```
Implementation pattern:
```tsx
{/* Desktop Table */}
<div className="hidden md:block overflow-x-auto">
  <table>...</table>
</div>

{/* Mobile Cards */}
<div className="md:hidden space-y-3">
  {attendedList.map(reg => (
    <div className="bg-white rounded-xl border p-4 space-y-2">...</div>
  ))}
</div>
```

### 3.6 — Student Profile Page (`/student/profile`)

**File**: `components/student/StudentProfileClient.tsx`

**Issues**:
- Profile form layout needs audit for mobile form fields

**Changes**:
- Form grid: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`
- Action buttons: full width on mobile

### 3.7 — Student Arena / Gamification (`/student/arena`)

**File**: `components/student/GamificationSection.tsx`

**Critical Issue**: Leaderboard uses fixed grid:
```tsx
grid grid-cols-[60px_1fr_120px_100px_120px]
```
This is ~500px minimum width — overflows on mobile.

**Change**:
- Mobile: Show only Rank, Name+USN, Score (3 columns)
- Tablet+: Show all 5 columns

```tsx
// Mobile (default)
<div className="grid grid-cols-[40px_1fr_80px]">
  Rank | Name+USN | Score
</div>

// Desktop (md+)
<div className="hidden md:grid grid-cols-[60px_1fr_120px_100px_120px]">
  Rank | Student | Branch | Badges | Score
</div>
```

- Stats header `grid grid-cols-1 sm:grid-cols-3`: already responsive ✓
- Badge cards `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`: already responsive ✓
- Tab overflow: tabs could overflow if too many — add `overflow-x-auto` to tab row

### 3.8 — Student Calendar (`/student/calendar`)

**File**: `components/student/RealtimeCalendarView.tsx` → `shared/EventCalendar.tsx`

**Issues**:
- Calendar grid cells may be too small on mobile
- Event tooltips/popovers need to be repositioned on mobile

**Changes**:
- Calendar: reduce cell padding on mobile
- Show event count badges instead of full event names on narrow screens

---

## 🗂️ PHASE 4: TEACHER ROLE PAGES

### 4.1 — Teacher Verify Page (`/teacher/verify/[id]`)

**File**: `components/teacher/EditableVerifyDetails.tsx`

**Issues**:
- Massive form with many sections: venue, schedule, settings, semester toggles
- Semester/Year toggle buttons: `grid grid-cols-4 gap-2` — wraps fine
- Category selection card grid: needs audit
- `text-xl font-black uppercase` headers may be too large on mobile

**Changes**:
- Category grid: `grid-cols-2 sm:grid-cols-3`
- Semester toggles: ensure min 44px touch targets
- Form labels: ensure all inputs have `w-full`
- `HackathonConfigPanel` embedded inside: see Phase 5

### 4.2 — Teacher Events Page

**File**: `app/teacher/events/page.tsx`

**Changes**: Standard responsive audit — heading, filter controls, event list cards.

### 4.3 — Teacher Create Event (`/teacher/events/create`)

**File**: `components/teacher/EditEventForm.tsx`

**Changes**: Large form — ensure all inputs stack properly on mobile.

### 4.4 — Teacher Reports (`/teacher/reports`)

Similar pattern to other reports pages — table-to-card conversion.

### 4.5 — Teacher Hackathon/Judge Panel (`/teacher/hackathon`)

Audit the judge scoring interface for mobile.

---

## 🗂️ PHASE 5: HACKATHON CONFIGURATION

### 5.1 — HackathonConfigPanel

**File**: `components/student/HackathonConfigPanel.tsx`

**Issues**:
- Dense panels with grid switches and sliders
- Criteria scoring table: `grid grid-cols-[1fr_auto_auto]` could overflow

**Changes**:
- Section cards: `p-4 md:p-6`
- Submission config grid: `grid-cols-1 sm:grid-cols-2`
- Criteria items: ensure name input + score input don't wrap badly
- Toggle switches: ensure 44px tap targets

### 5.2 — ProjectSubmissionPortal

**File**: `components/student/ProjectSubmissionPortal.tsx`

**Issues**:
- URL input fields on mobile need proper keyboard type
- Form sections need single-column mobile layout

**Changes**:
- URL inputs: `inputMode="url"` attribute
- Form: `space-y-4` single column default

---

## 🗂️ PHASE 6: CC ROLE PAGES

### 6.1 — CC Dashboard + Events

**File**: `app/cc/dashboard/page.tsx`, `app/cc/events/[id]/page.tsx`

**Changes**: Standard responsive audit.

### 6.2 — CC Hackathon Manager

**File**: `components/cc/CCHackathonManager.tsx`

**Changes**:
- Scoreboard tables: mobile card view
- Judge assignment panels: single column on mobile

### 6.3 — CC Event Edit Form

**File**: `components/cc/EditEventForm.tsx`

**Changes**: Full-width form fields, responsive grid sections.

### 6.4 — CC Feedback Form Builder

**File**: `components/cc/FeedbackFormBuilder.tsx`

**Issues**:
- Question builder UI with drag handles — touch-friendly on mobile?
- Question type selector may overflow

**Changes**:
- Drag handles: increase size on mobile
- Question type dropdown: full-width on mobile

### 6.5 — Discussion/Feedback/Registration Toggles

**Files**: `DiscussionToggle.tsx`, `FeedbackToggle.tsx`, `RegistrationToggle.tsx`

**Changes**: Ensure toggle rows wrap properly on narrow screens.

---

## 🗂️ PHASE 7: ADMIN ROLE PAGES

### 7.1 — Admin Dashboard

**File**: `app/admin/dashboard/page.tsx`

**Changes**: Stats cards grid → `grid-cols-2 md:grid-cols-4`.

### 7.2 — Admin Users Table (CRITICAL)

**File**: `components/admin/UserTable.tsx`

**Issues**:
- 4-column table: Name+USN | Course | Role | Actions
- Actions column contains: Edit button + Role select + Suspend button — all in one flex row

**Changes**:
- Mobile card view: Each user becomes a card
  ```
  [Name (bold)] [USN (mono)]
  [Department badge] [Role badge]
  [Actions: Edit | Role dropdown | Suspend]
  ```
- Actions on mobile: Stack vertically or use a `...` menu
- Modals (Edit User, Confirm): Already use `p-4` + `max-w-sm/md` → mostly OK, just ensure they don't overflow with keyboard open (add `overflow-y-auto` to modal body)

### 7.3 — Admin Security/Logs Page (CRITICAL)

**File**: `components/admin/LogsPageClient.tsx`

**Critical Issues**:
- `text-6xl font-black` heading: `text-6xl` = 60px font — on 320px viewport this is massive
- Stats grid: `grid-cols-2 lg:grid-cols-4` — OK on mobile
- FilterBar: `flex flex-wrap items-end gap-6 p-8 border-2 rounded-[2.5rem]` — `p-8` (32px) on mobile is very tight
- Group headers: `flex flex-wrap items-center justify-between gap-6 p-8` — heavy

**Changes**:
- Heading: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
- FilterBar: `p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem]`
- Group button: `p-4 sm:p-6 md:p-8`
- Timeline items: stack IP/UA/session info vertically on mobile
- Export + drain buttons: wrap on mobile (`flex-wrap`)

### 7.4 — Admin Events List

**File**: `components/admin/AdminEventList.tsx`

**Changes**: Responsive card/table layout.

### 7.5 — Admin Attendance Manager

**File**: `components/admin/AttendanceManager.tsx`

**Changes**: Table-to-card conversion for mobile.

### 7.6 — Admin Backup / Selective Backup

**Files**: `components/admin/SelectiveBackupCard.tsx`, `components/admin/AbsoluteBackupButton.tsx`

**Changes**: Button stacking on mobile.

### 7.7 — Admin Event Registration Stats

**File**: `components/admin/EventRegistrationStats.tsx`

**Changes**: Responsive chart/stat display.

### 7.8 — Admin Scanner Page

**Changes**: QR scanner full-screen — mostly OK, ensure camera feed is properly sized.

### 7.9 — Admin Create User Modal

**File**: `components/admin/CreateUserModal.tsx`

**Changes**: Modal form responsive on mobile.

### 7.10 — Admin Broadcast Button

**File**: `components/admin/BroadcastButton.tsx`

**Changes**: Panel layout for mobile.

### 7.11 — Admin Combined Sheet Button

**File**: `components/admin/CombinedSheetButton.tsx`

**Changes**: Download options panel for mobile.

### 7.12 — Admin Audit Management

**File**: `components/admin/AuditManagement.tsx`

**Changes**: Audit list responsive layout.

---

## 🗂️ PHASE 8: PR / MANAGER / HOD ROLE PAGES

### 8.1 — PR Layout + Dashboard

**File**: `app/pr/layout.tsx`, `app/pr/dashboard/page.tsx`

**Issues**:
- PR layout has 3 navbars / additional sidebar — check for mobile
- Audit queue page: table with event list items

**Changes**: Standard responsive audit.

### 8.2 — PR Scanner

**File**: `components/pr/PRScannerWithGate.tsx`

**Changes**: Full-screen scanner view — ensure camera UI is mobile-optimized.

### 8.3 — PR Review Form

**File**: `components/pr/PRReviewForm.tsx`

**Changes**: Form responsive layout.

### 8.4 — Manager Dashboard + Events

**Files**: `app/manager/dashboard`, `app/manager/events`, `app/manager/scanner`

**Changes**: Standard responsive audit.

### 8.5 — Manager QR Scanner

**File**: `components/manager/QRScanner.tsx`

**Changes**: Full-screen camera UI on mobile.

### 8.6 — HOD Dashboard + Approvals

**Files**: `app/hod/dashboard`, `app/hod/approvals`

**Changes**: Approval cards in single column on mobile.

---

## 🗂️ PHASE 9: SHARED COMPONENTS

### 9.1 — EveBot (AI Chatbot)

**File**: `components/shared/EveBot.tsx`

**Issues**:
- Floating chat panel likely has fixed width and position
- On mobile, chat panel should be full-screen or bottom-sheet

**Changes**:
- Desktop: `fixed bottom-4 right-4 w-[380px]`
- Mobile: `fixed bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl` (bottom sheet)
- Add safe-area-inset-bottom padding

### 9.2 — MessagesPanel

**File**: `components/messages/MessagesPanel.tsx`

**Issues**:
- Slide-in panel from the right — likely desktop-oriented
- On mobile should be full-width slide from bottom or full-screen

**Changes**:
- Mobile: Full-screen overlay `fixed inset-0`
- Desktop (md+): `fixed right-0 top-[60px] h-[calc(100vh-60px)] w-[380px]`

### 9.3 — BugReporterWidget

**File**: `components/BugReporterWidget.tsx`

**Issues**:
- The `fixed` bug reporter panel — likely large popup
- On mobile should be bottom-sheet or full-screen modal

**Changes**:
- Mobile: Full-screen modal or bottom sheet
- Increase touch targets for all interactive elements

### 9.4 — EventCalendar

**File**: `components/shared/EventCalendar.tsx`

**Changes**:
- Calendar cells: reduce padding on mobile `p-1`
- Event badges: show dot indicators on very small screens
- Navigation: ensure prev/next buttons are 44px+ targets

### 9.5 — EventBackgroundCustomizer

**File**: `components/shared/EventBackgroundCustomizer.tsx`

**Changes**:
- Panel layout: single column on mobile
- Color pickers: larger touch targets

### 9.6 — PosterDesigner (COMPLEX)

**File**: `components/shared/PosterDesigner.tsx` (137KB)

**Issues**:
- Canvas-based designer — nearly impossible to use on mobile
- Should show a "desktop only" message on mobile with option to continue anyway

**Changes**:
- Add a mobile warning banner:
  ```
  📐 Poster Designer works best on desktop.
  You can still continue, but touch controls may be limited.
  ```
- Ensure the toolbar panel scrolls properly on narrow screens

### 9.7 — VenueSelector

**File**: `components/shared/VenueSelector.tsx`

**Changes**:
- Dropdown panel: ensure it doesn't overflow viewport on mobile
- Map embed: responsive iframe with `aspect-video`

### 9.8 — PatternPicker

**File**: `components/shared/PatternPicker.tsx`

**Changes**:
- Dropdown: position to avoid viewport overflow on mobile
- Hide icon on very narrow screens in navbar (handled in Phase 1.2)

### 9.9 — ShareEventButton

**File**: `components/student/ShareEventButton.tsx`

**Issues**:
- Share card with team member display — complex layout

**Changes**:
- Share modal: `max-w-sm` with `mx-4` on mobile
- Use native Web Share API on mobile when available:
  ```tsx
  if (navigator.share) {
    navigator.share({ title, url });
  } else {
    // show modal
  }
```

### 9.10 — QRDisplay

**File**: `components/student/QRDisplay.tsx`

**Changes**:
- QR modal: ensure it fits in viewport `max-h-[90vh] overflow-y-auto`
- QR code size: responsive `w-full max-w-[240px]`

### 9.11 — ProfileUpdateSlider

**File**: `components/student/ProfileUpdateSlider.tsx`

**Issues**:
- Slide-in panel likely has fixed width

**Changes**:
- Mobile: Full-width `w-full` or `w-[min(100vw,420px)]`
- Form fields: full-width stack

### 9.12 — SkeletonLoader

**File**: `components/shared/SkeletonLoader.tsx`

**Changes**: Ensure skeleton widths are responsive (use `w-full` instead of fixed widths).

### 9.13 — ImageUploadInput

**File**: `components/ui/ImageUploadInput.tsx`

**Changes**: Upload area should be full-width on mobile, touch-friendly.

---

## 🗂️ PHASE 10: SPECIFIC PROBLEM AREAS

### 10.1 — Fixed Heights → Fluid Heights

Components with fixed heights that need to become fluid on mobile:
- `EventThread`: `height: 560px` → `h-[400px] sm:h-[500px] md:h-[560px]`
- `LogsPageClient` timeline: max-height containers need responsive values

### 10.2 — Hover-Only Interactions → Touch Fallbacks

Components using `opacity-0 group-hover:opacity-100` for actions:
- `EventThread` message actions: add `md:opacity-0 md:group-hover:opacity-100` (always visible on mobile)
- LogsPageClient group hover: similar pattern

### 10.3 — Overflow-X Horizontal Scrollers

Add scroll snap + scroll-behavior for better touch:
```css
.horizontal-scroll {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.horizontal-scroll > * {
  scroll-snap-align: start;
}
```

### 10.4 — Font Size Scaling

Large hero headings need to scale:

| Context | Current | Mobile | Tablet |
|---|---|---|---|
| Admin Logs | `text-6xl` | `text-3xl` | `text-4xl` |
| Admin Intelligence | `text-6xl` | `text-3xl` | `text-5xl` |
| Dashboard welcome | `text-4xl` | `text-2xl` | `text-3xl` |
| Page `h1` | `text-3xl` | `text-xl` | `text-2xl` |

### 10.5 — Form Inputs: Prevent iOS Auto-Zoom

iOS zooms in when input font-size < 16px. All inputs must have `text-base` (16px) on mobile OR:
```css
@media (max-width: 768px) {
  input, select, textarea {
    font-size: 16px !important;
  }
}
```
Add to `globals.css`.

---

## 🗂️ PHASE 11: TOUCH UX IMPROVEMENTS

### 11.1 — Minimum Touch Target Size

All buttons, links, and interactive elements:
- Minimum: `h-11` (44px) or `min-h-[44px]`
- Small icon buttons: wrap in a `p-2` container to expand hit area

### 11.2 — Mobile-Specific Navigation

The existing mobile sidebar is good but:
- Add swipe-to-close gesture detection
- Bottom navigation bar option for key student pages (Dashboard, Events, Arena, Profile)
  - This would be a **NEW** component: `BottomNav.tsx` shown only on mobile for student role

### 11.3 — Keyboard Avoidance

For chat inputs (`EventThread`), when mobile keyboard opens:
- The input should stay visible
- Add `env(keyboard-inset-height)` if supported
- Use `resize: none` on textareas with auto-expand

### 11.4 — Pull-to-Refresh (Native Feel)

For event lists and dashboards on mobile, consider adding a visual pull-to-refresh indicator using the browser's native scroll event.

---

## 🗂️ PHASE 12: PRINT / NOT-FOUND / STATIC PAGES

### 12.1 — Not Found Page

**File**: `app/not-found.tsx`

**Changes**: Responsive layout, centered content, proper mobile typography.

### 12.2 — Status Page (`/status`)

**File**: `app/status/page.tsx`

**Changes**: Status indicator cards responsive grid.

---

## 📋 COMPLETE FILE LIST

### Layout Files (7 files)
1. `app/student/layout.tsx` — padding fix
2. `app/teacher/layout.tsx` — padding fix
3. `app/admin/layout.tsx` — padding fix
4. `app/cc/layout.tsx` — padding fix
5. `app/manager/layout.tsx` — padding fix
6. `app/pr/layout.tsx` — padding fix
7. `app/hod/layout.tsx` — padding fix

### Global (2 files)
8. `app/globals.css` — mobile rules, iOS zoom fix, touch improvements
9. `tailwind.config.ts` — add custom utilities if needed

### Auth (2 files)
10. `app/(auth)/login/page.tsx` — header layout, card padding
11. `app/(auth)/register/page.tsx` — form responsive

### Shared Components (12 files)
12. `components/shared/Navbar.tsx` — right side overflow
13. `components/shared/EveBot.tsx` — bottom-sheet on mobile
14. `components/shared/EventCalendar.tsx` — responsive cells
15. `components/shared/EventBackgroundCustomizer.tsx` — mobile layout
16. `components/shared/PosterDesigner.tsx` — mobile warning
17. `components/shared/VenueSelector.tsx` — dropdown overflow
18. `components/shared/PatternPicker.tsx` — dropdown overflow
19. `components/shared/SkeletonLoader.tsx` — responsive widths
20. `components/shared/BrandMark.tsx` — mobile size
21. `components/messages/MessagesPanel.tsx` — full-screen mobile
22. `components/BugReporterWidget.tsx` — bottom-sheet mobile

### UI Components (3 files)
23. `components/ui/ImageUploadInput.tsx` — touch-friendly
24. `components/ui/Button.tsx` — min-height 44px
25. `components/ui/Input.tsx` — font-size 16px on mobile

### Student Components (10 files)
26. `components/student/StudentEventsView.tsx` — timeline mobile
27. `components/student/StudentAttendanceClient.tsx` — table→cards
28. `components/student/GamificationSection.tsx` — leaderboard grid
29. `components/student/TeamFormationPortal.tsx` — mobile layout
30. `components/student/HackathonConfigPanel.tsx` — dense panels
31. `components/student/ProjectSubmissionPortal.tsx` — form layout
32. `components/student/EventThread.tsx` — chat height, hover→touch
33. `components/student/StudentFeedbackTerminal.tsx` — modal height
34. `components/student/ShareEventButton.tsx` — Web Share API
35. `components/student/ProfileUpdateSlider.tsx` — panel width
36. `components/student/QRDisplay.tsx` — modal responsive
37. `components/student/StudentProfileClient.tsx` — form layout

### Student Page Files (5 files)
38. `app/student/dashboard/page.tsx` — heading, scroll
39. `app/student/events/page.tsx` — if exists
40. `app/student/events/[id]/page.tsx` — event detail
41. `app/student/attendance/page.tsx` — page heading
42. `app/student/arena/page.tsx` — gamification page

### Teacher Components (3 files)
43. `components/teacher/EditableVerifyDetails.tsx` — form layout
44. `components/teacher/EditEventForm.tsx` — form layout
45. `components/teacher/DraftManager.tsx` — responsive

### Admin Components (9 files)
46. `components/admin/UserTable.tsx` — table→cards (CRITICAL)
47. `components/admin/LogsPageClient.tsx` — headings, filter bar
48. `components/admin/AdminEventList.tsx` — card/table
49. `components/admin/AttendanceManager.tsx` — table→cards
50. `components/admin/EventRegistrationStats.tsx` — stats grid
51. `components/admin/SelectiveBackupCard.tsx` — card layout
52. `components/admin/CreateUserModal.tsx` — modal form
53. `components/admin/BroadcastButton.tsx` — panel
54. `components/admin/CombinedSheetButton.tsx` — options panel
55. `components/admin/AuditManagement.tsx` — list layout

### CC Components (5 files)
56. `components/cc/CCHackathonManager.tsx` — scoreboard mobile
57. `components/cc/EditEventForm.tsx` — form responsive
58. `components/cc/FeedbackFormBuilder.tsx` — builder mobile
59. `components/cc/DiscussionToggle.tsx` — toggle layout
60. `components/cc/EventPhotosGallery.tsx` — gallery grid

### PR Components (2 files)
61. `components/pr/PRScannerWithGate.tsx` — scanner UI
62. `components/pr/PRReviewForm.tsx` — form layout

### Manager Components (3 files)
63. `components/manager/QRScanner.tsx` — scanner mobile
64. `components/manager/EditEventForm.tsx` — form layout
65. `components/manager/RegistrationExportMenu.tsx` — menu

### Static Pages (3 files)
66. `app/not-found.tsx` — responsive
67. `app/status/page.tsx` — responsive
68. `app/page.tsx` (root redirect) — any landing page content

---

## 🧪 VERIFICATION CHECKLIST

After implementation, verify at these viewport sizes:

| Viewport | Test |
|---|---|
| 320×568px (iPhone SE) | Login, Student Dashboard, Events List, Attendance |
| 375×667px (iPhone 8) | Team Formation, EventThread chat |
| 390×844px (iPhone 14) | Hackathon Config, Leaderboard |
| 414×896px (iPhone 11 Max) | Admin Users, Admin Logs |
| 768×1024px (iPad) | All dashboards |
| 1024×768px (Laptop) | Full desktop check |

### Testing Strategy
1. Chrome DevTools → Device Toolbar → each viewport listed above
2. Test all interactive elements: forms submit, modals open/close, chat input works
3. Test dark mode at each breakpoint
4. Test with iOS keyboard open (virtual keyboard)
5. Test horizontal orientation (landscape mode on phone)
6. Run `npm run build` after every major phase to ensure no TypeScript errors

---

## 🔄 IMPLEMENTATION ORDER (Priority)

```
WEEK 1 (HIGH IMPACT, LOW RISK):
├── Phase 1: Global Layouts (7 layout files) ← DO THIS FIRST
├── Phase 2: Auth Pages
└── Phase 3.1-3.3: Student Dashboard + Events

WEEK 2 (HIGH IMPACT, MEDIUM RISK):
├── Phase 3.4: TeamFormationPortal  
├── Phase 3.5: Student Attendance (table→cards)
├── Phase 3.7: Gamification (leaderboard grid fix)
└── Phase 9.1-9.2: EveBot + MessagesPanel mobile

WEEK 3 (MEDIUM IMPACT):
├── Phase 7: All Admin pages
├── Phase 4: Teacher pages
└── Phase 5: Hackathon panels

WEEK 4 (COMPLETION):
├── Phase 6: CC pages
├── Phase 8: PR/Manager/HOD
└── Phase 9-12: Remaining shared components
```

---

*Generated after full audit of the Curdrice Club-Eve platform codebase.*
*Covers 68+ files across all roles: student, teacher, admin, cc, manager, pr, hod.*

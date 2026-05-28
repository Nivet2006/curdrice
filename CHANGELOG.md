# Changelog

All notable changes to Club-Eve, reverse-chronological.

---

## 2026-05-28 — Student Management & Profile Approval

**New Components**
| Component | Path | Purpose |
|-----------|------|---------|
| `ManageStudentsPanel` | `components/faculty/` | Dept. roster table, multi-select, bulk promote, edit modal, status badges |
| `ProfileUpdateSlider` | `components/student/` | Right-drawer slider for profile change requests, field-by-field diff, history |
| `ProfileUpdateApprovalQueue` | `components/hod/` | Realtime Supabase subscription queue, approve/reject with feedback |

**Server Actions**
- `lib/actions/teacher-students.ts` → `getDepartmentStudents(dept)`, `bulkPromoteStudents(ids, sem, yr)`, `updateStudentByTeacher(id, details)` — admin client with role guard
- `lib/actions/profile-requests.ts` → `submitProfileUpdateRequest(field, val)`, `getStudentUpdateRequests()`, `getPendingProfileRequests(dept)`, `processProfileRequest(id, approve, feedback)` — ALLOWED_FIELDS whitelist: `full_name`, `usn`, `department`, `semester`, `year`

**Database** — Migration `0010_student_management.sql`
- New table: `profile_update_requests` (student_id, field, current_value, new_value, status, feedback, reviewed_by, reviewed_at) with RLS
- `profiles` columns: `has_backlog` boolean, `year_back` boolean

**API** — `GET /api/hod/pending-requests?dept=X` for realtime polling re-fetch

**Dashboard Wiring**
- `app/teacher/dashboard/page.tsx` → fetches dept students, renders `ManageStudentsPanel`
- `app/hod/dashboard/page.tsx` → fetches pending requests, passes `initialProfileRequests` to client
- `app/student/profile/page.tsx` → renders `ProfileUpdateSlider` below profile card
- `components/hod/HODDashboardClient.tsx` → accepts `initialProfileRequests` prop, mounts approval queue

---

## 2026-04-20 — Authorization Pipeline & Security

**Teacher/HOD Approval** (`app/teacher/`, `app/hod/`)
- Event lifecycle: `draft` → `pending_teacher` → `pending_hod` → `approved` | `rejected`
- HOD scoped by `targeted_department`; realtime status via `postgres_changes` subscriptions

**PR Audit** (`app/pr/`)
- Post-event attendance verification, feedback quality scoring, faculty assignment tracking

**Combined Attendance Sheet** (`app/api/admin/combined-sheet/`)
- 8-semester `.xlsx` export + summary sheet; frozen USN/Name cols, `COUNTIF` formulas, `ExcelOverlay` progress UI

**TOTP v13 Migration**
- `otplib` v12→v13 functional API; multi-stage 2FA gate on all admin/faculty routes via middleware

**Fixes**
- Stale session: middleware detects `Refresh Token Not Found` → explicit `signOut()` + clean redirect
- PostgREST join drop: decoupled `registrations` + `profiles` fetches, merged via JS maps
- Fetch caching: `cache: 'no-store'` on admin Supabase client

---

## 2026-03-28 — ShieldLoader Extraction

- Extracted login ShieldLoader into reusable `components/shared/ShieldLoader.tsx`
- Props: `visible`, `message`, `steps[]` — supports login + logout contexts
- Navbar logout: specialized steps (Terminating, Clearing, etc.), mobile sidebar auto-close, loading guards
- `MutationObserver` for live `data-theme` sync on loader backdrop

---

## 2026-03-23 — Shield Auth Overlay

- Full-screen `fixed` overlay (`z-index: 9998`, `backdrop-blur: 6px`) on login
- 4-step animated sequence: Credentials → Integrity → Session → Profile (900ms/step)
- SVG shield pulse (1.12x @ 1.4s) + stroke-draw checkmark animation
- Session handover: overlay persists through Next.js redirect, dismisses only on error

---

## 2026-03-22 — Core Platform Features

**Eligibility Engine** (`lib/actions/events.ts`)
- Server-side check: student `semester`/`year`/`department` vs `event_constraints` arrays
- Deadline enforcement, capacity limit via DB RPC

**QR Scanner v2** (`components/manager/QRScanner.tsx`)
- Two-step flow: scan → lookup card (student + event info) → manual "Mark Present"
- `lookupQRToken` + `confirmCheckIn` server actions via service role client

**Admin User Management** (`components/admin/UserTable.tsx`)
- Confirmation modal + `verifyAdminPassword` for destructive actions
- Edit user modal: full_name, usn, department, semester, year
- `updateUserDetails` server action with admin client RLS bypass
- `router.refresh()` + uncontrolled `<select key={role}>` fix for state sync

**Theme System** (`app/globals.css`)
- CSS vars: `:root` (light) vs `[data-theme="dark"]` with aggressive `*` selectors
- `localStorage` persist + `prefers-color-scheme` detection
- Dark overrides: error states (`#3d0a0a` bg, `#ff6b6b` text), button contrast, SVG visibility

**Mobile Navbar** (`components/shared/Navbar.tsx`)
- Responsive: hidden links on `<768px`, hamburger → slide-in `fixed` panel with `backdrop-blur-sm`
- Role-based dynamic links via `usePathname` active state

**Student Profile** (`components/student/StudentProfileClient.tsx`)
- New columns: `username` (TEXT UNIQUE), `profile_edited` (BOOLEAN)
- One-time edit lock, live registration + attendance counters

**Skeleton Loaders** — `loading.tsx` for all role layouts, theme-aware `SkeletonLoader` shared component

**UserTable Sync** — `router.refresh()` post-action, `defaultValue` + `key` pattern for uncontrolled selects

**DB Changes**
- `profiles`: +`username`, +`profile_edited`
- `events`: +`approval_status`, +`targeted_department`, +`rejection_data`, +`feedback_config`, +`feedback_open`, +`is_public`
- New tables: `event_constraints`, `backup_logs`, `conversations`, `conversation_members`, `messages`, `notifications`
- RLS policies for CC, PR, Teacher, HOD roles

---

## 2026-03-21 — Initial Build

**Auth** — USN-first login, student self-registration (`/register`), role-based redirect, Zod validation

**Student** — Event browse, one-click register (eligibility-gated), branded QR (`|||··||` Canvas overlay), QR download

**Manager** — Event CRUD with `ConstraintBuilder` (semester/year/dept toggles), attendance table, XLSX exports (registered + attendees)

**Admin** — User management (promote/demote/soft-delete), all-events oversight, QR scanner, backup centre (ZIP via SheetJS + jszip)

**Architecture**
- Next.js 14 App Router + TypeScript, Supabase Postgres + RLS + GoTrue
- Service Role Key for admin server actions, `@/*` → `./*` path alias
- Tailwind CSS with CSS variable theming, `qrcode` + Canvas API for QR generation

**Bugs Resolved (18)**
1. `tsconfig.json` path mapping → deleted `src/`
2. Tailwind content paths → `src/`
3. Zod error property in register action
4. RLS blocking post-signup profile INSERT
5. Route group `()` causing 404s
6. `.next` cache → 307 redirect loops
7. Ghost auth accounts → infinite redirects
8. Missing admin dashboard components
9. `registerForEvent is not a function`
10. Postgres ENUM rejecting `'deleted'`
11. Registration form UX (controlled → toast)
12. `qr_token` NOT NULL violations
13. QR lookup returning empty
14. Supabase silent FK join drop
15. Next.js fetch caching → stale data
16. Invalid `email` column in profiles
17. RLS blocking attendance names
18. PostgREST embedded join array drop

---

## Migrations

| # | File | What it does |
|---|------|-------------|
| 0000 | `initial_schema.sql` | `profiles`, `events`, `event_constraints`, `registrations`, `backup_logs` |
| 0001 | `rls_policies.sql` | RLS for student, manager, admin |
| 0002 | `messaging.sql` | `conversations`, `conversation_members`, `messages`, `notifications` |
| 0003 | `clubeve_extension.sql` | CC role, approval columns, event status enum expansion |
| 0004 | `fix_rls_for_cc.sql` | CC-specific RLS fixes |
| 0005 | `iic_report_schema.sql` | `iic_feedback`, `iic_flyers`, `iic_photos`, `iic_reports` |
| 0006 | `bug_reporter_chat.sql` | `bug_reports`, `bug_messages` |
| 0007 | `bug_reporter_fixes.sql` | Bug reporter RLS + schema patches |
| 0008 | `enable_rls_iic_tables.sql` | RLS on IIC tables |
| 0009 | `add_is_public_to_events.sql` | `events.is_public` boolean |
| 0010 | `student_management.sql` | `profile_update_requests` table, `profiles.has_backlog` + `year_back` |

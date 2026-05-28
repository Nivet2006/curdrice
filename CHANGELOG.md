# Changelog

All notable changes to Club-Eve, reverse-chronological.

---

## 2026-05-29 — Event Discussion Threads

**Discord-like per-event group chat** — CC toggles discussion on/off; group conversation auto-created on first enable; students auto-joined on registration.

**New Components**
| Component | Path | Purpose |
|-----------|------|--------|
| `DiscussionToggle` | `components/cc/` | CC toggle with Discord-themed UI, LIVE/OFFLINE status, member count |
| `EventThread` | `components/student/` | Discord-like chat: @mention autocomplete, reply threading, emoji reactions, realtime |

**Server Actions** — `lib/actions/event-threads.ts`
- `toggleDiscussion(eventId, enabled)` — CC/admin toggle, lazy conversation creation
- `joinEventThread(eventId, userId)` — called from `registerForEvent` after successful registration
- `getEventThread(eventId)` — returns conversation + member count
- `getThreadMessages(conversationId)` — messages with sender, reply_to, reactions joins
- `sendThreadMessage(conversationId, senderId, body, replyToId?)` — sends + parses `@USN` mentions → creates `thread_mention` notifications
- `toggleReaction(messageId, userId, emoji)` — add/remove emoji reaction
- `deleteThreadMessage(messageId, userId)` — soft-delete own messages
- `getThreadMembers(conversationId)` — @mention autocomplete data

**Database** — Migration `0011_event_discussions.sql`
- `events`: +`discussion_enabled` boolean
- `conversations`: +`event_id` text FK → events
- `messages`: +`reply_to_id` uuid FK → messages (self-referencing)
- New table: `message_reactions` (message_id, user_id, emoji) with unique constraint
- RLS: members read reactions in their conversations; toggle/delete own
- Realtime publication: `message_reactions` added to supabase_realtime

**Types** — `lib/types.ts`
- `discussion_enabled: boolean` on Event
- `event_id: string | null` on Conversation
- `reply_to_id`, `sender?`, `reply_to?`, `reactions?` on Message
- New `MessageReaction` interface
- `'thread_mention'` added to NotificationType union

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

**Also**
- Public event viewing: unauthenticated users can browse `is_public` events via proxy bypass; RSVP redirect for logged-out visitors
- Event sharing button (`ShareEventButton`) with personalized invitation cards + theme-aware UI
- Auto-redirect to internal route for logged-in students visiting public event pages
- Theme toggler + background pattern picker embedded in public event detail header
- Faculty user promotion with HOD approval flow

---

## 2026-05-15 — Admin Event Management & Audit Logs

- **Admin Event CRUD** server actions with secure 2FA-verified bulk deletion
- **Audit log read/write** — admin log viewer with separate log store architecture
- **Mass backup + selective backup** with purge capability
- **Auto-refresh** polling in Next.js router for admin dashboards
- Redesigned audit log badges (dynamic hex for dark mode)

---

## 2026-05-11 — PR System Overhaul & E2E Testing

**PR System** (`505adce0`)
- Full PR event audit queue with scanner, annotations, and review workflow
- PR attendance scanner standardized to shared `QRScanner` component (matching admin flow)
- PR dashboard with event assignments, feedback auditing, and report generation
- Android PR application integration handoff (`pr_android_handoff.md`)

**E2E Testing** (`2eb2328d`, `8157ab86`)
- Comprehensive Playwright test suite across all roles (student, manager, admin)
- Custom bug reporting utility integrated into test infrastructure
- Cross-role student registration + dynamic event details navigation stabilized
- Test report: 100% pass status

---

## 2026-05-03 — Bug Reporter & IIC Report Generator

**Bug Reporter Suite**
- Real-time chat between reporters and admins in Bug Central (`fbfe365a`)
- 1000-char limit + bullet instructions on report form (`f379442b`)
- Auto-save, PDF/Excel exports, secure access key management (`94f13748`)
- Markdown support with preview, emoji sanitization for WinAnsi PDF encoding
- History fetched via Access ID (not user ID) for privacy
- Bug reporter widget: global visibility toggle with realtime publication + robust parsing
- `BugReporterWidget.tsx` — sleek scrollbar, dark mode contrast fixes
- PDF export: isolated print layouts to prevent CSS clashes
- `useBugCollector` hook for programmatic bug collection

**IIC Report Generator** (`fa59a919`, `6e0e7983`)
- Full-stack PDF synthesis with server-side charting (Chart.js + chartjs-node-canvas)
- Attendance graphs, feedback charts, signature block pagination
- Multi-step form with `StudentAutocomplete`, dynamic resource persons schema
- Strict feedback gates (mandatory 3-question minimum)
- Routed to second Supabase project (`LOGS_SUPABASE_URL`) for isolated storage
- Premium header/footer with institutional logos, minimalistic B&W theme
- Route: `/reports/iic-generator`

---

## 2026-04-21 — CC Feedback, PR Scanner & Bug Widget Hardening

- **CC Feedback Toggle** (`9609b131`) — CC can enable/disable student feedback per event
- **Student Feedback Terminal** — real-time feedback submission with visibility logic
- **PR QR Scanner** — upgraded to match admin verification flow (lookup → confirm)
- **Bug Widget Fixes** — access key realtime sync via PK comparison, history monkey-patching TS fix
- **HOD Approval View** — display feedback questions + event constraints in approval modal
- Dark mode fixes: Entered badge, ReportHubCard, button text contrast

---

## 2026-04-19 — Next.js 16 Migration, TOTP & Forensic Audit Portal

**Next.js 14 → 16 Migration** (`fa31f34a`, `1152b13c`, `d8902531`)
- Upgraded Next.js, ESLint, eslint-config-next for security vulnerability resolution
- `middleware.ts` → `proxy.ts` migration for Next.js 16 convention
- `next.config` migrated to Turbopack, deprecated webpack/eslint config
- `await createClient()` across all files for async `cookies()` compatibility
- `await params` + `searchParams` for Next.js 15+ compatibility

**TOTP/2FA** (`618ff48a`, `5ed51139`)
- Mandatory admin TOTP gate with rate limiting
- `otplib` v12 → v13 functional API migration (Turbopack compatible)
- `TotpSetupWizard` — interactive secret generation, QR display, manual entry
- `TotpLoginStep` — dark mode visibility, Suspense-wrapped `useSearchParams`

**Forensic Audit Portal** (`81dd0a13`, `c4c98f87`)
- Site-wide audit logging with separate log store architecture
- Admin intelligence portal: log viewer, drain terminal, multi-format export
- Forensic polling system with manual "Sync Now" button
- Flat brutalist design (no 3D shadows), production-ready with dynamic rendering

**Event ID Migration** (`2cca3d50`, `83c35ca3`, `a9bb0939`)
- UUID → 8-digit alphanumeric primary key for events
- Unique 6-digit alpha-numeric event PID for internal tracking
- "Auth Code" system for human-readable event identification

**Teacher/HOD Dashboard** (`a7aba4a4`, `9c3f8626`, `d7d540f4`)
- Unified event status tracker, teacher dashboard overhaul
- Department-scoped visibility matching HOD logic
- Live registration stats replacing verification terminal
- Dynamic greeting + profile name personalization
- Dark mode: total visibility for Intelligence Portal, badge contrast, Vault Purge modal

**Status Dashboard** (`3395e960`, `958c021e`)
- Professional system status page at `/status` with Vercel API integration
- Admin-only access restriction, secret BrandMark portal (double-click entry)
- ACCESS DENIED overlay: randomized violent shake + ghost fade effects
- Global navbar branding + pattern selector integration

---

## 2026-04-17 — Guardian CI, EveBot NLP & Easter Eggs

**Guardian CI Pipeline** (`b544a3c1`)
- Secret scanning, live status dashboard integration
- Granular CI step failure/warning surfacing
- Non-blocking security audit for dependency CVEs
- Status history with commit messages + build duration logs

**EveBot NLP Engine** (`41d84cd0`)
- Bayesian NLP engine integrated into EveBot — local ML at $0 cost
- Interactive username configuration cards
- Strict monochrome UI with advanced beaming animations
- Recursive exploration queue fixes

**Event Sharing** (`5220b4f9`, `de899837`)
- Aesthetic event sharing with personalized invitation cards
- Theme-aware UI, pastel mode easter egg (global toggle)
- Secret pastel egg relocated to registration badge

---

## 2026-04-16 — Messaging & Rebranding

**Real-Time Messaging** (`14a8a881`, `d019b879`, `4e5cbe2b`)
- Complete chat system: DM accept flow, conversation management
- Theme-aware `MessagesPanel` with CSS variables + pattern visibility
- Dark mode for messaging panel, broadcast modal
- Event-linked card sharing in chats
- QR display integration in message panels

**Rebrand: CurdRice → Club-Eve** (`58b2c414`, `237e4a90`)
- Package rename to `club-eve-app`
- Synced renaming across all files
- ROADMAP.md created with academic, student, and admin feature vision

**Background Patterns** (`1098cf41`, `6315b4f7`)
- 12 selectable background patterns for dashboards
- Robust auth error handling improvements

**Combined Attendance Sheet** (`89ac8a24`)
- Multi-semester `.xlsx` export with exceljs
- Custom loading overlay during generation
- Delete confirmation modal with event details + registration count

---

## 2026-04-15 — Auth & Event ID

- USN + email dual login support (`97b160a9`)
- 8-digit event "Auth Code" system for human-readable IDs

---

## 2026-04-12 — Messaging Foundation & Production Prep

- Real-time chat scaffolding with conversation management
- Theme-aware `MessagesPanel`, dark mode navbar
- Rebrand from CurdRice → Club Eve initiated
- Development artifact cleanup for production readiness

---

## 2026-03-29 — ShieldLoader, Calendar & Dashboard

- Refined logout flow with reusable `ShieldLoader` component
- Realtime dashboard updates via Supabase subscriptions
- Calendar timeline for student events (keke-style)
- Enhanced event validation

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

**Admin Dashboard** — real-time stats (users, events, registrations, attendance)

**Skeleton Loaders** — `loading.tsx` for all role layouts, theme-aware shared component

**Animated 404** — floating gears animation on not-found page

**Vercel Production Build** — ESLint warnings downgraded, seed.ts excluded from TS build

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

**Branded QR Engine** (`lib/qr.ts`) — `|||··||` watermark overlay via Canvas API, 300x340 PNG

**Site-Wide Backup** (`/admin/backup`) — full DB ZIP export via SheetJS + jszip, `backup_logs` audit trail

**Export System** — per-event registered/attendee XLSX downloads via `/api/export/`

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
| 0011 | `event_discussions.sql` | `events.discussion_enabled`, `conversations.event_id`, `messages.reply_to_id`, `message_reactions` table |

---

## Infrastructure

| Component | Detail |
|-----------|--------|
| CI Pipeline | Guardian — secret scanning, status dashboard, non-blocking CVE audit |
| Status Page | `/status` — Vercel API integration, build history, admin-only |
| Audit Logs | Separate Supabase project (`LOGS_SUPABASE_URL`), forensic polling |
| E2E Tests | Playwright — cross-role coverage, auto bug reporting |
| Hosting | Vercel (zero-config Next.js) |
| Native Apps | Android (CC + PR handoffs), Expo cross-platform attendance |

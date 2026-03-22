# PLANNING.md — EventHub: Club Event Management System
> Architecture, goals, style, and constraints for the full-stack build.
> Last updated: 2026-03-21

---

## 1. Project Overview

A college club event management web app with **three roles** — **Admin**, **Manager**, and **Student**.
Students register for events and receive a branded QR code (with `|||··||` embedded). Managers run events
and control who can register. Admins have full system control including site-wide backups.

Design language mirrors [nived.work](https://nived.work) — minimal, monospace accents, clean white,
with the `|||··||` brand mark appearing on auth pages **and** inside every QR code.

**Live reference:** `https://curdrice.nivet2006.in/login`

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Students can browse, register for, and view their events |
| G2 | Each registered student gets a unique branded QR code (`|||··||` watermark) |
| G3 | Managers can create, edit, delete events and set registration constraints |
| G4 | Managers can restrict registration by semester, year, department |
| G5 | Managers can download registered list and attendee list per event |
| G6 | Admins scan QR codes to mark attendance in real-time |
| G7 | Admins have full access — all manager capabilities + user management |
| G8 | Admins can perform a full site-wide data backup (JSON + XLSX inside ZIP) |
| G9 | All data persisted in Supabase (Postgres + Auth + Storage) |
| G10 | Design matches portfolio aesthetic — minimal, sharp, monospace |

---

## 3. Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  ADMIN  (Superuser)                                     │
│  ├── Everything a Manager can do                        │
│  ├── Manage all users (promote, demote, soft-delete)    │
│  ├── Site-wide data backup (full ZIP export)            │
│  ├── View all events across all clubs/managers          │
│  └── QR Scanner                                         │
├─────────────────────────────────────────────────────────┤
│  MANAGER  (Club / Event Operator)                       │
│  ├── Create / Edit / Delete their own events            │
│  ├── Set registration constraints per event:            │
│  │     - Allowed semesters  (e.g. [5, 6, 7])           │
│  │     - Allowed years      (e.g. [2, 3])              │
│  │     - Allowed departments (e.g. ['CSE', 'ISE'])     │
│  │     - Max capacity                                   │
│  │     - Registration open / close dates                │
│  ├── Download registered students list (XLSX)           │
│  ├── Download attendees list — checked-in only (XLSX)  │
│  ├── QR Scanner                                         │
│  └── View attendance dashboard for their events         │
├─────────────────────────────────────────────────────────┤
│  STUDENT  (End User)                                    │
│  ├── Browse and search events                           │
│  ├── Register for events (if constraints are met)       │
│  ├── View + download their QR code per event            │
│  └── View their own registration history                │
└─────────────────────────────────────────────────────────┘
```

### Role Assignment Rules
- All self-registrations default to `student`
- `manager` and `admin` roles are assigned by an existing `admin` only
- No self-promotion — enforced by RLS + server-side validation

---

## 4. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 14** (App Router, TypeScript) | SSR, API routes, file-based routing |
| Auth | **Supabase Auth** | Email/password, role metadata |
| Database | **Supabase Postgres** | Free tier, real-time, RLS |
| Query | **Supabase JS SDK v2** | Direct typed queries |
| Styling | **Tailwind CSS** + CSS vars | Utility-first theming |
| QR Generation | **qrcode** + **canvas API** | QR PNG with `|||··||` text overlay |
| QR Scanning | **html5-qrcode** | Camera-based in-browser scanning |
| Export / Backup | **xlsx** (SheetJS) + **jszip** | XLSX sheets bundled into ZIP |
| Validation | **Zod** | Runtime schema validation |
| Forms | **react-hook-form** + Zod resolver | Typed, validated forms |
| Icons | **lucide-react** | Consistent icon set |
| Hosting | **Vercel** | Zero-config Next.js deploys |

---

## 5. Database Schema (Supabase Postgres)

### `profiles` (extends Supabase `auth.users`)
```sql
id            uuid PRIMARY KEY REFERENCES auth.users(id)
full_name     text NOT NULL
usn           text UNIQUE NOT NULL          -- e.g. 1GD24CS098
department    text NOT NULL                 -- e.g. CSE
semester      int NOT NULL
year          int NOT NULL
role          text NOT NULL DEFAULT 'student'
              -- ENUM: 'student' | 'manager' | 'admin' | 'deleted'
created_at    timestamptz DEFAULT now()
```

### `events`
```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
title                   text NOT NULL
description             text
club_name               text NOT NULL
location                text
event_date              timestamptz NOT NULL
registration_deadline   timestamptz
max_capacity            int
status                  text DEFAULT 'upcoming'
                        -- 'upcoming' | 'ongoing' | 'completed'
banner_url              text
created_by              uuid REFERENCES profiles(id)
created_at              timestamptz DEFAULT now()
```

### `event_constraints`  ← NEW
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id            uuid UNIQUE REFERENCES events(id) ON DELETE CASCADE
allowed_semesters   int[]       -- e.g. {5,6,7}       NULL = no restriction
allowed_years       int[]       -- e.g. {2,3}          NULL = no restriction
allowed_departments text[]      -- e.g. {'CSE','ISE'}  NULL = no restriction
created_at          timestamptz DEFAULT now()
```

### `registrations`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
event_id        uuid REFERENCES events(id) ON DELETE CASCADE
student_id      uuid REFERENCES profiles(id) ON DELETE CASCADE
qr_token        text UNIQUE NOT NULL        -- UUID encoded in QR
checked_in      boolean DEFAULT false
checked_in_at   timestamptz
registered_at   timestamptz DEFAULT now()
UNIQUE (event_id, student_id)
```

### `backup_logs`  ← NEW
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
performed_by    uuid REFERENCES profiles(id)
backup_type     text NOT NULL               -- 'full'
file_name       text NOT NULL               -- e.g. eventhub-backup-2026-03-21.zip
row_counts      jsonb                       -- { profiles: 80, events: 12, registrations: 150 }
created_at      timestamptz DEFAULT now()
```

---

### Row Level Security (RLS) Summary

| Table | Student | Manager | Admin |
|-------|---------|---------|-------|
| `profiles` | Read/update own | Read own | Read + update all |
| `events` | Read all | Read all; insert/update/delete own | Full |
| `event_constraints` | Read all | Insert/update/delete for own events | Full |
| `registrations` | Read/insert own | Read for their events; update `checked_in` | Full |
| `backup_logs` | None | None | Full |

---

## 6. Project File Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx                   -- All users table
│   │   │   └── [id]/page.tsx              -- Edit role / soft-delete
│   │   ├── events/
│   │   │   ├── page.tsx                   -- All events (all managers)
│   │   │   └── [id]/page.tsx              -- Override any event
│   │   ├── scanner/page.tsx
│   │   ├── attendance/
│   │   │   ├── page.tsx
│   │   │   └── [eventId]/page.tsx
│   │   └── backup/page.tsx                -- ← BACKUP CENTRE
│   │
│   ├── (manager)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx                   -- Manager's own events
│   │   │   ├── create/page.tsx
│   │   │   └── [id]/
│   │   │       ├── edit/page.tsx
│   │   │       └── attendance/page.tsx    -- Attendance + downloads
│   │   └── scanner/page.tsx
│   │
│   ├── (student)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   └── events/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx              -- Detail + register + QR
│   │
│   ├── api/
│   │   ├── checkin/route.ts               -- POST: mark attendance via token
│   │   ├── export/
│   │   │   ├── registered/route.ts        -- GET: XLSX registered students
│   │   │   └── attendees/route.ts         -- GET: XLSX checked-in only
│   │   └── backup/
│   │       └── route.ts                   -- GET: full site backup ZIP
│   │
│   ├── layout.tsx
│   └── page.tsx                           -- Redirect → /login
│
├── components/
│   ├── ui/                                -- Button, Card, Badge, Modal, Toast, Spinner
│   ├── admin/
│   │   ├── StatsCard.tsx
│   │   ├── UserTable.tsx
│   │   ├── RoleSelector.tsx
│   │   └── BackupPanel.tsx                -- Backup UI + log table
│   ├── manager/
│   │   ├── EventForm.tsx                  -- Includes constraint section
│   │   ├── ConstraintBuilder.tsx          -- Multi-select semester/year/dept toggles
│   │   ├── AttendanceTable.tsx
│   │   └── DownloadButtons.tsx
│   ├── student/
│   │   ├── EventCard.tsx
│   │   └── QRDisplay.tsx                  -- Branded QR with |||··|| overlay
│   └── shared/
│       ├── Navbar.tsx
│       ├── BrandMark.tsx                  -- |||··|| component
│       ├── QRScanner.tsx
│       └── ProtectedRoute.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   ├── registrations.ts
│   │   ├── constraints.ts                 -- Eligibility checker
│   │   └── users.ts                       -- Admin role management
│   ├── qr.ts                              -- Branded QR generation
│   ├── export.ts                          -- SheetJS XLSX helpers
│   ├── backup.ts                          -- Full ZIP backup logic
│   └── types.ts                           -- All Zod schemas + TS types
│
├── middleware.ts                           -- Route protection by role
├── public/
├── styles/globals.css
├── .env.local
├── PLANNING.md
├── TASK.md
└── tsconfig.json
```

---

## 7. Design System — Portfolio-Inspired

### Color Palette (CSS Variables)
```css
:root {
  --bg:           #ffffff;
  --bg-subtle:    #f5f5f5;
  --fg:           #0a0a0a;
  --fg-muted:     #6b6b6b;
  --accent:       #2d2df0;
  --accent-hover: #1a1ab8;
  --green:        #2d9e5f;
  --red:          #e53e3e;
  --amber:        #d97706;
  --border:       #e5e5e5;
  --card-bg:      #ffffff;
  --mono:         'JetBrains Mono', 'Fira Code', monospace;
  --sans:         'Inter', sans-serif;
}
```

### Role Badge Colors
| Role | Style |
|------|-------|
| admin | `bg-[--accent] text-white` |
| manager | `bg-amber-100 text-amber-800 border border-amber-200` |
| student | `bg-gray-100 text-gray-700` |

### The `|||··||` Brand Mark Component
```tsx
// components/shared/BrandMark.tsx
export const BrandMark = ({ className }: { className?: string }) => (
  <span
    className={`font-mono text-sm tracking-widest select-none text-[--fg-muted] ${className}`}
  >
    |||··||
  </span>
)
```

**Placement rules:**
- Auth pages (`/login`, `/register`): `position: absolute; top: 1.5rem; right: 1.5rem`
- All nav layouts: subtle in sidebar bottom or nav footer
- **Inside every QR code image** (bottom-left, monospace overlay — see Section 10)

---

## 8. Auth & Route Protection

### Login Flow
```
/login
  → supabase.auth.signInWithPassword()
  → fetch profiles.role
  → 'admin'   → /admin/dashboard
  → 'manager' → /manager/dashboard
  → 'student' → /student/dashboard
  → 'deleted' → show "Account suspended" error, no redirect
```

### Middleware (`middleware.ts`)
```ts
const routes = [
  { prefix: '/admin',   roles: ['admin'] },
  { prefix: '/manager', roles: ['manager', 'admin'] },
  { prefix: '/student', roles: ['student', 'manager', 'admin'] },
]
// Unauthenticated → /login
// Auth pages with session → redirect to role dashboard
```

---

## 9. Feature Breakdown — Form by Form

---

### FORM 1: Login (`/login`)
**Fields:** Email, Password
**Validation:** `z.string().email()` / `z.string().min(6)`
**On submit:** `supabase.auth.signInWithPassword()` → fetch role → redirect
**UI:** Centered card · `> EventHub` top-left · `|||··||` absolute top-right

---

### FORM 2: Student Registration (`/register`)
**Fields:**
- Full Name
- USN — validated regex: `/^\d[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/`
- Department (select: CSE / ECE / ME / CV / ISE / EEE)
- Semester (select: 1–8)
- Year (1–4)
- Email, Password, Confirm Password

**On submit:**
1. `supabase.auth.signUp({ email, password })`
2. `INSERT INTO profiles (..., role = 'student')`
3. Redirect → `/student/dashboard`

---

### FORM 3: Create / Edit Event + Constraints
**Routes:** `/manager/events/create` · `/manager/events/[id]/edit`

**Event Fields:**
- Title, Club Name, Description
- Location, Event Date & Time, Registration Deadline
- Max Capacity, Status
- Banner Image (→ Supabase Storage `event-banners`, max 2MB)

**Constraint Fields (rendered by `ConstraintBuilder.tsx`):**
```
Allowed Semesters   [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ][ 7 ][ 8 ]
Allowed Years       [ 1 ][ 2 ][ 3 ][ 4 ]
Allowed Depts       [ CSE ][ ECE ][ ME ][ CV ][ ISE ][ EEE ]
Leave none selected = open to all
```

**On submit:**
1. Upload banner → Supabase Storage
2. `INSERT INTO events` (or `UPDATE`)
3. `UPSERT INTO event_constraints` with arrays of selected values
4. Redirect → `/manager/events`

---

### FORM 4: Student Event Registration (button on `/student/events/[id]`)

**Server-side eligibility check** (`lib/actions/constraints.ts`):
```ts
async function checkEligibility(studentId: string, eventId: string) {
  // 1. Fetch student profile
  // 2. Fetch event_constraints
  // 3. Check allowed_semesters, allowed_years, allowed_departments
  //    (null array = no restriction on that dimension)
  // 4. Check registration_deadline not passed
  // 5. Check capacity (use DB RPC to avoid race condition)
  return { eligible: boolean, reason?: string }
}
```

**If ineligible:** show specific reason banner:
> "This event is open to Semester 5, 6, 7 students only."
> "Registration is closed."
> "Event is at full capacity."

**If eligible → on click:**
1. Server Action inserts `registrations` row + `qr_token = crypto.randomUUID()`
2. Generate branded QR (Section 10)
3. Show QR in modal — "Registered ✓" green header

---

### FORM 5: Admin — Manage Users (`/admin/users`)

**Table:** Name · USN · Department · Semester · Role · Joined · Actions

**Actions:**
- Promote → Manager
- Demote → Student
- Soft-delete (sets `role = 'deleted'`, preserves data)

**FORM 5a — Role Change Modal:**
```
User: Nived Shaji  (1GD24CS098)
Current: student
New role: [ manager ▼ ]
[ Confirm ]  [ Cancel ]
```
Only Server Actions touch `profiles.role` — no direct client writes.

---

### FORM 6: QR Scanner (`/admin/scanner` · `/manager/scanner`)

1. Optional event selector dropdown
2. `html5-qrcode` opens camera, decodes token
3. `POST /api/checkin` → `{ token, eventId? }`
4. Server: find by `qr_token` → update `checked_in = true`
5. Toast:
   - ✅ Checked In — Nived Shaji · 1GD24CS098 · CSE Sem 6
   - ⚠️ Already Checked In — 10:32 AM

---

## 10. Branded QR Code (`lib/qr.ts`)

Every QR code has `|||··||` rendered as a text overlay at the bottom.

```ts
import QRCode from 'qrcode'

/**
 * Generates a branded QR code PNG data URL with |||··|| watermark.
 * Runs client-side (uses canvas API).
 */
export async function generateBrandedQR(
  token: string,
  studentName: string
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 300
  canvas.height = 340    // extra 40px for branded footer bar

  // 1. QR into canvas
  await QRCode.toCanvas(canvas, `eventhub://checkin?token=${token}`, {
    width: 300,
    margin: 2,
    color: { dark: '#0a0a0a', light: '#ffffff' },
  })

  const ctx = canvas.getContext('2d')!

  // 2. Footer bar
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 300, 300, 40)

  // 3. |||··|| — bottom-left, monospace
  ctx.fillStyle = '#6b6b6b'
  ctx.font = '13px "JetBrains Mono", monospace'
  ctx.textAlign = 'left'
  ctx.fillText('|||··||', 12, 326)

  // 4. Student name — bottom-right
  ctx.fillStyle = '#0a0a0a'
  ctx.font = '11px Inter, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(studentName, 288, 326)

  return canvas.toDataURL('image/png')
}
```

**QR Display Component (`components/student/QRDisplay.tsx`):**
- Shows the PNG image (300×340)
- USN + event name in monospace below
- "Download QR" → saves PNG as `qr-<event>-<usn>.png`
- Accessible any time from student dashboard

---

## 11. Export & Download Features

### Per-Event Downloads (Manager + Admin)

**Registered Students**
`GET /api/export/registered?eventId=<uuid>`
```
USN | Full Name | Department | Semester | Year | Email | Registered At
```

**Attendees (Checked-In Only)**
`GET /api/export/attendees?eventId=<uuid>`
```
USN | Full Name | Department | Semester | Year | Email | Checked In At
```

Both routes: validate session, check manager owns event OR is admin.

---

## 12. Site-Wide Backup System (`/admin/backup`)

**Admin-only.** Full export of all system data as a single ZIP archive.

### ZIP Contents

| File | Contents |
|------|----------|
| `profiles.xlsx` | All user profiles (excl. passwords) |
| `events.xlsx` | All events |
| `event_constraints.xlsx` | All constraint configs |
| `registrations.xlsx` | All registrations + check-in status |
| `backup_logs.xlsx` | Audit log of previous backups |
| `README.txt` | Timestamp, performed by, row counts |

### Backup API (`/api/backup/route.ts`)
```ts
// 1. Validate: admin session required (SUPABASE_SERVICE_ROLE_KEY)
// 2. Fetch all rows from all tables via service role client
// 3. Convert each table → XLSX workbook via SheetJS
// 4. Bundle all files into ZIP via jszip
// 5. INSERT INTO backup_logs with row_counts
// 6. Stream ZIP: Content-Disposition: attachment; filename="eventhub-backup-<date>.zip"
```

### `lib/backup.ts`
```ts
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function generateBackupZip(admin: SupabaseClient): Promise<{
  buffer: Buffer
  rowCounts: Record<string, number>
  fileName: string
}> {
  const zip = new JSZip()
  const tables = ['profiles', 'events', 'event_constraints', 'registrations', 'backup_logs']
  const rowCounts: Record<string, number> = {}

  for (const table of tables) {
    const { data, error } = await admin.from(table).select('*')
    if (error || !data) continue
    rowCounts[table] = data.length

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, table)
    zip.file(`${table}.xlsx`, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
  }

  const date = new Date().toISOString().split('T')[0]
  const totalRows = Object.values(rowCounts).reduce((a, b) => a + b, 0)
  zip.file('README.txt', [
    'EventHub Site Backup',
    `Generated: ${new Date().toISOString()}`,
    `Total rows: ${totalRows}`,
    ...Object.entries(rowCounts).map(([t, n]) => `  ${t}: ${n} rows`),
  ].join('\n'))

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })
  return { buffer, rowCounts, fileName: `eventhub-backup-${date}.zip` }
}
```

### Backup UI (`/admin/backup`)
```
┌──────────────────────────────────────────────────────────┐
│  🗄  Backup Centre                                       │
│  Export a complete snapshot of all system data.          │
│                                                          │
│  Includes: users · events · constraints ·                │
│            registrations · attendance                    │
│                                                          │
│  [ ⬇  Download Full Backup (.zip) ]                     │
│                                                          │
│  Previous Backups                                        │
│  ┌────────────┬───────────┬──────────────┬────────────┐  │
│  │ Date       │ By        │ Total Rows   │ File       │  │
│  ├────────────┼───────────┼──────────────┼────────────┤  │
│  │ 2026-03-20 │ Admin     │ 242          │ .zip ↓    │  │
│  └────────────┴───────────┴──────────────┴────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 13. Page-by-Page Summary

| Route | Role | Description |
|-------|------|-------------|
| `/login` | Public | Email/password login |
| `/register` | Public | Student self-signup |
| `/admin/dashboard` | Admin | Full stats, all events |
| `/admin/users` | Admin | User list + role management |
| `/admin/events` | Admin | All events across all managers |
| `/admin/scanner` | Admin | QR scanner |
| `/admin/attendance` | Admin | Attendance across all events |
| `/admin/attendance/[id]` | Admin | Per-event table + downloads |
| `/admin/backup` | Admin | **Site-wide backup download + log** |
| `/manager/dashboard` | Manager | Their events stats |
| `/manager/events` | Manager | Their event list |
| `/manager/events/create` | Manager | Create event + constraints |
| `/manager/events/[id]/edit` | Manager | Edit event + constraints |
| `/manager/events/[id]/attendance` | Manager | Attendance + downloads |
| `/manager/scanner` | Manager | QR scanner |
| `/student/dashboard` | Student | Registered events + QR codes |
| `/student/events` | Student | Browse eligible events |
| `/student/events/[id]` | Student | Detail, register, view QR |

---

## 14. Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # Server only — backup + admin APIs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 15. Supabase Setup Checklist

- [ ] Create Supabase project
- [ ] Run schema SQL (Section 5) in SQL editor
- [ ] Enable RLS on all 5 tables
- [ ] Add all RLS policies per role (Section 5)
- [ ] Create `event-banners` storage bucket (public read, 2MB limit)
- [ ] Enable Email auth; disable confirmation for local dev
- [ ] Seed first admin:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE usn = 'ADMIN001';
  ```
- [ ] Test RLS: student cannot read another student's registrations
- [ ] Test RLS: manager cannot edit another manager's events
- [ ] Test RLS: only admin can read/insert backup_logs

---

## 16. Constraints & Hard Rules

1. `SUPABASE_SERVICE_ROLE_KEY` is **server-only** — never in client bundles.
2. Role changes only via **Server Actions** — no client-side writes to `profiles.role`.
3. **RLS is the real security** — frontend role checks are UX only.
4. **Eligibility check is server-side** — `constraints.ts` runs before insert.
5. **Capacity is a DB-level RPC** — prevents race conditions on popular events.
6. **QR tokens are UUIDs** — never expose internal DB row IDs.
7. **Backup route requires admin session + service role** — double validated.
8. **Max banner: 2MB** — validate client-side before upload.
9. **No file longer than 500 lines** — split into modules.
10. **Strict TypeScript** — no `any`. Use `supabase gen types typescript`.
11. **`|||··||` mark** — appears on auth pages (top-right) AND in every QR code (bottom-left overlay).
12. **Managers only see their own events** — enforced by `created_by = auth.uid()` in RLS.
13. **Soft delete users** — `role = 'deleted'`, never hard delete (preserves history).
14. **Backup logs are append-only** — no RLS update/delete on `backup_logs`.
15. **Path Aliases** — Ensure `tsconfig.json` paths point to `"./*"` instead of `"./src/*"` since all code is in the project root.
16. **Tailwind Config** — Ensure `tailwind.config.ts` content paths point to `"./app/**/*"` and `"./components/**/*"` instead of `"./src/*"`.

---

## 17. Key Dependencies (`package.json`)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "@supabase/supabase-js": "^2.43.0",
    "@supabase/ssr": "^0.3.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.4",
    "lucide-react": "^0.383.0",
    "qrcode": "^1.5.3",
    "html5-qrcode": "^2.3.8",
    "xlsx": "^0.18.5",
    "jszip": "^3.10.1",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/qrcode": "^1.5.5",
    "eslint": "^8",
    "prettier": "^3.2.0",
    "vitest": "^1.5.0"
  }
}
```

---

## 18. Implementation Order (Phases)

### Phase 1 — Foundation
- [ ] Init Next.js 14 + TypeScript + Tailwind
- [ ] Install all dependencies (Section 17)
- [ ] Supabase project + run schema SQL + RLS policies
- [ ] `lib/supabase/client.ts` and `lib/supabase/server.ts`
- [ ] `middleware.ts` — 3-role route protection

### Phase 2 — Auth
- [ ] `/login` with `|||··||` top-right, `> EventHub` top-left
- [ ] `/register` student sign-up
- [ ] Server Actions: `login()`, `register()`, `logout()`
- [ ] Role-based redirect post-login

### Phase 3 — Manager Flow
- [ ] Manager dashboard
- [ ] Events list, create, edit (with `ConstraintBuilder`), delete
- [ ] `event_constraints` UPSERT on save
- [ ] QR Scanner page

### Phase 4 — Student Flow
- [ ] Student dashboard + event browse
- [ ] Server-side eligibility check before registration
- [ ] `generateBrandedQR()` with `|||··||` overlay
- [ ] QR modal + download button

### Phase 5 — Admin Flow
- [ ] Admin dashboard (aggregate stats)
- [ ] User management (role assignment, soft-delete)
- [ ] View all events + attendance override

### Phase 6 — Export + Backup
- [ ] `/api/export/registered` and `/api/export/attendees`
- [ ] Download buttons on attendance pages (manager + admin)
- [ ] `lib/backup.ts` — ZIP generation
- [ ] `/api/backup/route.ts`
- [ ] `/admin/backup` UI + log table

### Phase 7 — Polish & Deploy
- [ ] Responsive (mobile-first)
- [ ] Loading skeletons, toasts, error boundaries
- [ ] Empty states everywhere
- [ ] Full RLS audit
- [ ] `supabase gen types typescript` → `lib/database.types.ts`
- [ ] Deploy to Vercel + set env vars

---

*Last updated: 2026-03-21*
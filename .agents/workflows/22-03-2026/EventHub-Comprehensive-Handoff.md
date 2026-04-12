---
description: Comprehensive System Handoff & Development Summary for EventHub
---

# 🚀 EventHub: The Ultimate Engineering Handoff & Architecture Guide
**Date:** 22-03-2026  
**Context:** This file is designed so that *any* developer (or AI Agent) can instantly understand the entire history, architecture, quirks, and exact state of the EventHub project natively, jumping straight into productive development without breaking existing systems.

---

## 🏗️ 1. Prerequisite Readme (START HERE)
If you are an AI reading this, you **MUST** read the following files before making any codebase changes:
1. `PLANNING.md`: The single source of truth for the database schema, role rules (Student vs Manager vs Admin), and the global design language (specifically the `|||··||` branding mark).
2. `TASK.md`: The active progression tracker. It lists out every feature built and every diagnostic error logged (`ERROR_1` through `ERROR_17`).
3. `.env.local` (Local Environment): You need `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and crucially `SUPABASE_SERVICE_ROLE_KEY`.

---

## 💻 2. Tech Stack & App Router Nuances
*   **Framework:** Next.js 14 (App Router) with TypeScript.
*   **Database & Auth:** Supabase (PostgreSQL + RLS + GoTrue Auth).
*   **Styling:** TailwindCSS (Monochrome, glassmorphism, rigorous focus on typography like `JetBrains Mono`).
*   **Security:** Strict Row-Level Security (RLS). Users can only see what their role allows natively in Postgres.
*   **File Structure:** `/app/(auth)`, `/app/(admin)`, `/app/(manager)`, `/app/(student)`. *(Note: Do not use parenthesis in folder names if they cause redirect cache loops; we flattened them where caching conflicted).*

---

## 🛠️ 3. Execution Commands
To run the project locally, execute exactly this command in the project root:
```bash
npm run dev
```

To create a new Admin user (since you cannot self-assign the admin role via UI), execute this SQL inside the Supabase Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## 🐞 4. The 17 Core Bugs Solved Today (CRITICAL KNOWLEDGE)
Today was heavily focused on fixing deep architectural bugs relating to Next.js caching and Supabase SQL Constraints. If you encounter bugs in the future, **read these first**:

1. **Path Mapping Fixes:** Next.js `tsconfig.json` and `tailwind.config.ts` were pointing to a deleted `src/` folder. Paths were re-routed to `./app` and `./components`.
2. **Supabase RLS Insertion Drops:** The Server Actions could not insert rows into `profiles` after an Auth Signup because RLS blocked it. Fixed by instantiating the `@supabase/supabase-js` client using the `SUPABASE_SERVICE_ROLE_KEY` (The Edge Key) inside `createUserAdmin` to effortlessly bypass SQL blocks.
3. **Infinite 307 Redirect Loops:** Next.js `.next` cache desynced heavily between the `middleware.ts` role checks and Ghost auth accounts. Purged cache and rebuilt route folders.
4. **Postgres ENUM Rejections:** Admin "Suspend User" failed because `'deleted'` was blocked by the ENUM type. We ran SQL to `ALTER TYPE user_role ADD VALUE 'deleted'` and forced a PostgREST schema reload.
5. **UUID Constraint Violations:** Form actions failed because `qr_token` was strictly `NOT NULL`. Fixed by dynamically injecting `crypto.randomUUID()` during the Server Action schema parse.
6. **Supabase Silently Dropping Relational Arrays (The Nightmare Bug):** 
    * *The Symptom:* The Student Dashboard UI (`isRegistered`) and Admin Attendance List UI (Student Names) failed silently and vanished.
    * *The Cause:* The database queries used `.select('*, profiles(full_name)')`. Because there was either a missing Foreign Key, OR a duplicate redundant Foreign Key mapping `student_id` to `profiles`, the Supabase PostgREST API triggered an `Ambiguous Embedding` error, safely dropping the payload entirely without crashing the screen.
    * *The Fix:* We executed `ALTER TABLE public.registrations DROP CONSTRAINT registrations_student_id_profile_fkey;` natively in SQL.
7. **Aggressive Next.js `fetch` Caching Stating:**
    * *The Symptom:* Even after fixing the SQL database, the Admin tables still showed missing student names on refresh.
    * *The Cause:* Next.js 14 aggressively freezes standard API `fetch` requests (like those used by the bare `supabaseAdmin` client). It was loading the broken data from 30 minutes in the past!
    * *The Fix:* We aggressively opted out of the cache by configuring the Supabase Edge client natively:  
      `global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }`.
8. **Invalid Schema Projections:** At `admin/attendance/[id]`, PostgREST quietly dropped the array fetch because the UI explicitly instructed it to join the `email` column from `profiles`, which actually correctly resides in `auth.users`. Handled properly in Error 18.
9. **Institutional Branding Enforcement (RV to GD):** We deep-scanned the UI repo and replaced all legacy references of `1RV` (e.g. `1RV20CS001`) with the correct institution branding `1GD24CS098` / `1GD20CS001`.

---

## 🔒 5. Architecture Law: Bypassing Postgres RLS on the Edge
If you write a Server Action (e.g., `manualCheckIn` or `Admin List Fetch`) and the data is returning `null` or throwing `new row violates row-level security policy`:
**DO NOT** weaken the Postgres SQL RLS configuration natively.

**DO THIS INSTEAD:**
Elevate the context on the Server Component using the Service Role Key. This securely overrides RLS limitations for that exact isolated function without impacting user-facing privacy schemas:
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { 
    auth: { persistSession: false },
    global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
  }
)
```
*(Always verify role-authorization natively in your Code before doing this, e.g., checking if the user is an Admin via Auth Session).*

---

## 📸 6. Current Feature Completion
* **Student Pipeline:** Registration, Validations, Event Browsing, Tab filtering, Dynamic Branded QR Code Generation (via HTML5 Canvas).
* **Manager Pipeline:** Event Creation, Modification, Registration Constraint checking, List Export (XLSX).
* **Admin Pipeline:** God-mode Database List, Manual Check-In Overrides, Cross-Event Attendance, Native Postgres System Backup Generator (.zip).

You are clear to begin. Study the `PLANNING.md` structure, spin up `npm run dev`, and hack away!

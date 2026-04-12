# FIX SUMMARY: ERROR 22 - PostgREST Embedded Join Silent Array Drop

**Date:** 2026-03-22
**Components:** Admin Attendance List (`app/admin/attendance/[id]/page.tsx`)

## The Problem
The primary Attendance List failed to render internal attendee datasets natively displaying "Registered (0)", despite database connections confirming physical valid relationships directly across `registrations` and `profiles`. The framework accurately avoided Next.js caching barriers entirely yet still encountered an architectural mapping anomaly natively.

## Root Cause Analysis
The Supabase JavaScript SDK explicitly used embedded join syntax:
`.select('*, profiles(full_name, usn, department, semester)')`

Even though `pg_constraint` conclusively verified zero duplicate or ambiguous Foreign Keys existed natively linking the two schemas, PostgREST silently swallowed the array projection payload explicitly under an opaque "Ambiguous Embedding" edge-case bug. Because there were no functional schema errors returning, the Next.js process rendered exactly zero items effectively swallowing the data silently.

## The Solution
Successfully decoupled the single embedded join operation into an isolated internal two-step manual Javascript resolution pattern (identical to `/admin/users/page.tsx`):
1. Polled raw `registrations` exclusively filtering natively via `event_id`.
2. Extracted pure `student_id` arrays using `.map()`.
3. Requested isolated user schemas from the `profiles` table using explicit `.in()` operators strictly resolving the target bounds.
4. Manually re-structured and unified the JSON objects within the Server Component (`{ ...reg, profiles: { ... } }`), actively restoring complete compatibility with the `<AttendanceManager />` child properties natively.

## System Reset
- Node compilers explicitly killed.
- `.next` physical directory structurally unlinked and hard-deleted natively using Windows CMD blocks.
- Fresh deployment server restarted successfully generating accurate array structures natively for the UI hook.

# FIX SUMMARY: ERROR 17 - NextJS Server Component Aggressive `fetch` Caching

**Date:** 2026-03-22
**Component:** Admin and Manager Event Lists (`app/admin/attendance/[id]/page.tsx`, `app/manager/events/[id]/page.tsx`)

## The Problem
Immediately after resolving the PostgREST Ambiguous Embedding error involving redundant `student_id` mapping constraints in Postgres, the Admin UI continued to exhibit "Loaded (2)" entries but rendered missing database fields (Names, USNs, and Departments remained strictly as `-` or blank). Diagnostic console logs confirmed Supabase natively returned the complete profile JSON structures securely via the Edge Key without error — meaning the framework itself was failing to pipe the active data correctly to the DOM.

## Root Cause Analysis
Next.js 14 heavily applies aggressive static caching by default to all remote API `fetch` requests unlinked to dynamic routing functions (like `cookies()` or `headers()`). Because the Edge Elevation fix in *Error 16* relied on explicitly passing `{ auth: { persistSession: false } }` to `createClient` (which bypasses the native NextJS Server Action `cookies()` adapter), Vercel natively interpreted the Admin database queries as infinitely static payloads.

Thus, every browser refresh simply served the static HTML layout payload cached 30 minutes earlier, freezing the previous broken state where `profiles` had failed to join.

## The Solution
Instead of disabling caching on the entire layout tree natively with export directives, we surgically injected a cache-burst override straight into the `supabaseAdmin` SDK initializers.

1. Appended `global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }` symmetrically to the exact instantiation arguments overriding the underlying protocol.
2. This strictly opts out the Edge payload API routes from the Next.js Data Cache while maintaining layout caching speed context everywhere else.
3. The server natively polls and retrieves Live DB hydration synchronously on every refresh cycle.

## Files Touched
- `app/admin/attendance/[id]/page.tsx`
- `app/admin/backup/page.tsx`
- `app/manager/events/[id]/page.tsx`

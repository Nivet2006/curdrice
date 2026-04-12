# FIX SUMMARY: ERROR 18 - PostgREST Silently Dropping Arrays on Invalid Join Selectors

**Date:** 2026-03-22
**Component:** Admin Attendance List (`app/admin/attendance/[id]/page.tsx`)

## The Problem
During an automated End-to-End headless browser diagnostic session, the Admin Attendance List failed to render entries (`"No records found"`), completely contradicting the Node API test scripts that natively retrieved the array structures flawlessly moments earlier. The Attendance Portal successfully counted the users natively, but the specific ID page perpetually refused to serve them payloads to the DOM Client.

## Root Cause Analysis
The edge PostgREST query in `app/admin/attendance/[id]/page.tsx` was formulated as:
`.select('*, profiles(full_name, usn, email, department, semester)')`

Next.js Server Components inherently absorb payload drops natively without crashing. In PostgreSQL, `email` strictly lives securely inside `auth.users` and is actively omitted from the custom `public.profiles` payload. Because the SDK query requested a non-existent column inside the joined bucket explicitly, the Supabase Postgres Engine immediately threw a structural schema error behind the scenes, aggressively returning `null` array data to the application layout without throwing a 500 fatal loop.

## The Solution
1. Performed a direct SQL schema extraction over `information_schema.columns` to verify the precise shape of `profiles`. 
2. Removed the hallucinated `email` parameter from the relational `.select()` projection.
3. Automatically synchronized `app/admin/attendance/[id]/page.tsx` with identical functional specifications successfully utilized in the Manager workflow counterpart. 

## Files Touched
- `app/admin/attendance/[id]/page.tsx`

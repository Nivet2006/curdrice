# FIX SUMMARY: ERROR 21 - Stale Route Compilation & Explicit Schema Mapping

**Date:** 2026-03-22
**Components:** Admin Attendance List (`app/admin/attendance/[id]/page.tsx`), Backup Audit Log (`app/admin/backup/page.tsx`, `app/api/backup/route.ts`)

## The Problems
1. **Attendance List 0 Records**: The Supabase data query silently yielded empty arrays on the Admin Attendance UI despite existing records inside the PostgREST dataset, driven heavily by aggressive static route caching within Next.js.
2. **Audit Log Missing Admin Names & Inserts Failing**: The API handler strictly passed `filename`, but the internal database column anticipated `file_name`. The frontend UI attempted to read internal backup logs through an unauthorized anon client causing complete silent RLS projection failures.

## Root Cause Analysis
1. **Attendance List Cache Stagnation**: Even with `.next` cache purging, the Next.js router systematically retained the default static render parameters for the dynamic route. The Next fetch hook lacked internal strict parameters to explicitly dump cache chunks dynamically.
2. **Backup Log Payload Mismatch & RLS Blocks**: The PostgREST API seamlessly swallowed insertion objects missing `file_name`. The visual frontend utilized `createClient()` (anon auth) rendering invisible datasets due to strict internal RLS constraints blocking non-elevated readers.

## The Solutions
1. **Explicit Route Cache Disablement (Attendance)**: Hardcoded `export const dynamic = 'force-dynamic'` natively into the metadata header. Injected the explicit `supabaseAdmin` service role block enforcing a strict `cache: 'no-store'` interceptor over the global `fetch` parameters.
2. **Schema Param Mapping & Elevated UI Retrieval (Audit Log)**: 
   - Synchronized `app/api/backup/route.ts` payload explicitly from `filename` to `file_name`. 
   - Replaced the failing UI anon client inside `app/admin/backup/page.tsx` entirely with a `supabaseAdmin` service role hook, correctly correlating profiles via `log.admin_id`.
   - Updated UI matrix extraction to render `log.file_name`.
   - Hardcoded `export const dynamic = 'force-dynamic'` to permanently invalidate static route compilation arrays.
3. **Deep Build Purge**: Terminated phantom `node` compilers identically via `taskkill`, forcefully wiped `.next` via Windows CMD, and triggered a strictly clean dev compiler.

## Files Touched
- `app/admin/attendance/[id]/page.tsx`
- `app/api/backup/route.ts`
- `app/admin/backup/page.tsx`

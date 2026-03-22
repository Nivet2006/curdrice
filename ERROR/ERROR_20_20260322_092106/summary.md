# FIX SUMMARY: ERROR 20 - System Cache Invalidation & Schema Drift

**Date:** 2026-03-22
**Components:** Admin Attendance Roster (`app/admin/attendance/[id]/page.tsx`), Backup Audit Log (`app/admin/backup/page.tsx`, Postgres DB)

## The Problems
1. **Attendance Roster Stale Cache Loop**: The Attendance Roster consistently rendered "Registered (0)" entirely irrespective of functional backend registrations. A comprehensive database constraint validation physically confirmed NO duplicate or ambiguous foreign keys existed for `registrations.student_id`. The application actively suffered from Next.js payload cache staleness.
2. **Backup Log Column Drift**: The explicit UI log structure failed to render Admin Usernames, actively surfacing `System Admin`. The API generator (`route.ts`) inserted telemetry via the parameter `admin_id`, but the physical database rigidly defined the column as `performed_by`.

## Root Cause Analysis
1. **Aggressive Client Retrieval**: Next.js persistently served a compiled static bucket. Even with `cache: 'no-store'` initialized inside the payload compiler on the server, previously hard-compiled server components maintained state inside `.next` build files, creating a perpetual structural mismatch for real-time reads.
2. **Database Property Desynchronization**: The Postgres kernel silently ingested mismatched insert property trees seamlessly, throwing out the explicit mapping for `admin_id` internally without generating a 500 fatal exception hook because it did not align with internal SQL definitions. 

## The Solutions
1. **Deep Architecture Purge**: Triggered an explicit internal database schema sync via `SELECT pg_notify('pgrst', 'reload schema');`. Automatically terminated the `npm` sub-processes natively and manually destroyed `.next/` structural caches to force a fresh payload hook deployment.
2. **Structural Column Alignment**: Successfully synced the underlying API structure and Database configuration manually via: `ALTER TABLE public.backup_logs RENAME COLUMN performed_by TO admin_id;`. Deployed a surgical patch into `app/admin/backup/page.tsx` adjusting the frontend property targets away from `performed_by` precisely to `admin_id`.

## Files & Data Architectures Touched
- `public.backup_logs` (Postgres Schema)
- `app/admin/backup/page.tsx`
- `.next` (Purged)
- `PostgREST Engine` (Reloaded)

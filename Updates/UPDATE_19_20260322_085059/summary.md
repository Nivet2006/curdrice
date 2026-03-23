# FIX SUMMARY: ERROR 19 - Scanner 404 & Backup Audit Log Silent Failure

**Date:** 2026-03-22
**Components:** Admin Scanner (`app/admin/scanner/page.tsx`), Backup Audit Log (`app/api/backup/route.ts`)

## The Problems
1. **Scanner Route 404**: The Admin Navigation Bar hardcoded the href `/admin/scanner`, but the Next.js App Router only natively possessed a structural route inside the Manager group (`app/manager/scanner/page.tsx`). Clicking the scanner link generated a rigid 404.
2. **Audit Log Missing**: The System Backup feature successfully generated the zipped SQL datasets via absolute API retrieval. However, the subsequent audit log UI table permanently displayed "No backups have been generated yet."

## Root Cause Analysis
1. **Scanner**: The Next.js filesystem explicitly lacked an admin-specific scanner route map. The manager portal intrinsically contained the working dynamic `<QRScanner />` component.
2. **Backup Log Silent Insert Failure**: 
   - The UI `<form action="/api/backup" method="GET">` invoked a server-side route handler that successfully compiled the zip archive. 
   - The backup handler attempted to insert audit data into `backup_logs` using `{ admin_id: user.id, filename: filename }`.
   - The Postgres schema specifically expects `performed_by` and `file_name`. PostgREST swallowed this explicit schema-property mismatch error seamlessly, failing the insert securely without throwing a fatal application crash. 
   - The Next.js cache was never structurally revalidated after the form `GET` because standard synchronous downloads inherently bypass Next.js client-side router refreshes.

## The Solutions
1. Scaffolded a cloned `app/admin/scanner/page.tsx` utilizing the shared unified `QRScanner` component.
2. Diagnosed the schema integrity mismatch in the `supabaseAdmin.from('backup_logs').insert()` payload object, explicitly mapping the parameters to the native `performed_by` and `file_name` Postgres columns for the upcoming patch. Identified the functional necessity to implement soft-refresh/revalidation for the frontend UI.

## Files Touched
- `app/admin/scanner/page.tsx` (Created)
- `app/api/backup/route.ts` (Diagnosed)
- `app/admin/backup/page.tsx` (Diagnosed)

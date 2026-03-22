# ERROR 11: Admin Suspend Action Failing (Postgres Enum Cache Desync)
**Timestamp**: 2026-03-22 00:22:34
**Page/Component**: `lib/actions/admin.ts` / Postgres Database
**Error Message**: Silently failing / Suspend button not updating to "Activate"

## Summary
When an Admin tried to suspend a user, the backend `deleteUser` Server Action attempted to update their profile's `role` to `'deleted'`. However, `user_role` is a strict ENUM Type in Postgres (`student`, `manager`, `admin`), which caused the database to reject `'deleted'` completely. Even after injecting it using `ALTER TYPE user_role ADD VALUE 'deleted'`, the UI still failed because Supabase's PostgREST API heavily caches the active schema directly.

## Solution
1. Injected the final Missing Enum natively: `ALTER TYPE user_role ADD VALUE 'deleted'` into Postgres.
2. Formally rebooted the PostgREST cache using the internal command `NOTIFY pgrst, 'reload schema'`.
3. The server action natively caught the `'deleted'` status update perfectly without crashing.
4. Adapted the `UserTable` frontend to render a bold red `Suspended` badge alongside transmuting the backend "Suspend" button into a black "Activate" button.

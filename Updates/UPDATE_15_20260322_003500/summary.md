# ERROR 15: PostgREST Missing Relational Join Path
**Timestamp**: 2026-03-22 00:35:00
**Page/Component**: `app/student/events/[id]/page.tsx`
**Error Message**: Single query returning null and forcing the UI to display the "Register" button despite the user already existing in the database.

## Summary
The student page checked registration state by executing `.single()` on the `registrations` bucket while asking PostgreSQL to natively join the user's name from the `profiles` bucket. But since `registrations` only directly possessed a foreign-key to the hidden structural `auth.users` schema (and intentionally lacked a separate foreign key to `public.profiles`), the PostgREST auto-router threw a silent Relationship Error and aborted the fetch payload.

## Solution
1. Connected directly to the Supabase Engine and altered the active Postgres table payload.
2. Injected: `ALTER TABLE public.registrations ADD CONSTRAINT registrations_student_id_profile_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;`
3. Reloaded the active REST schema API dynamically. The payload instantly resolves the implicit join path flawlessly so the frontend catches the `true` UI state and paints the "Registered ✓" module along with the QR correctly natively!

# ERROR 13: Postgres Not-Null Constraint Violation on QR Token
**Timestamp**: 2026-03-22 00:27:00
**Page/Component**: `lib/actions/events.ts` (registerForEvent) / Postgres database
**Error Message**: `null value in column "qr_token" of relation "registrations" violates not-null constraint`

## Summary
The `registrations` table strictly requires a highly unique string in the `qr_token` column to construct the attendee's unique QR profile. Because the column lacks a native auto-generator function (`uuid_generate_v4()`) on the Supabase end, the server action payload was passing a void payload for the key, causing an immediate SQL hard-rejection.

## Solution
1. Injected `qr_token: crypto.randomUUID()` directly into the `registrations` payload matrix inside `/lib/actions/events.ts`.
2. This safely forces the Next.js runtime (via the Web Crypto API) to generate a fully cryptographically secure Version 4 UUID matching the expected column schema identically.
3. The SQL Transaction now executes natively without violating any internal null constraints.

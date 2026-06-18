# Audit Progress Log

## ✅ DONE

- **H3 (Performance):** Supabase singleton migration — 21 components/hooks. Commit `5a65cd8b`.
- **M2 (Security):** Env fail-fast — `lib/supabase/admin.ts` throws on missing vars; `lib/supabase/client.ts` warns. Applied.
- **L1 (Frontend):** OTP accessibility — `TotpCodeInput.tsx` has `role="group"`, `aria-label` per digit, `autoComplete="one-time-code"`, `role="alert"` on error. Applied.
- **H1 (Backend/Security):** TOTP userId trust — `lib/totp-challenge.ts` HMAC-SHA256 signer created. `lib/actions/auth.ts` sets signed pending-challenge cookie after password verify. `verify-login/route.ts` now reads userId from cookie instead of POST body. Commit pending.
- **M4 (Security):** TOTP cookie plain boolean — `curdrice_totp_verified` is now a signed HMAC token encoding `userId + expiry` (8h TTL). Commit pending.

## ⚠️ NOTED (not applied — need planning)

- **H2 (Database/Security):** Manager RLS ownership — migration file `0040_fix_manager_rls.sql` created. Apply with `supabase db push` against live DB.
- **M1 (Frontend):** StudentEventsView component split — refactor, not a bug.
- **M3 (Database):** Duplicate `0035` migration prefix — cosmetic, document and enforce going forward.
- **M5 (Performance):** Attendance aggregation — needs DB view/RPC migration.
- **L2 (Performance):** Heavy PDF/canvas/xlsx libraries — audit dynamic import usage.


Started: 2026-06-18T08:48:00Z

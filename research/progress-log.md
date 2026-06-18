# Audit Progress Log

## ✅ DONE

- **H3 (Performance):** Supabase singleton migration — 21 components/hooks. Commit `5a65cd8b`.
- **M2 (Security):** Env fail-fast — `lib/supabase/admin.ts` throws on missing vars; `lib/supabase/client.ts` warns. Applied.
- **L1 (Frontend):** OTP accessibility — `TotpCodeInput.tsx` has `role="group"`, `aria-label` per digit, `autoComplete="one-time-code"`, `role="alert"` on error. Applied.

## ⚠️ NOTED (not applied — need planning)

- **H1 (Backend):** TOTP userId trusted from client body — requires pending-challenge flow redesign.
- **H2 (Database/Security):** Manager RLS ownership — needs `0040_fix_manager_rls.sql` migration against live DB.
- **M1 (Frontend):** StudentEventsView component split — refactor, not a bug.
- **M3 (Database):** Duplicate `0035` migration prefix — cosmetic, document and enforce going forward.
- **M4 (Security):** TOTP cookie is a plain boolean — needs middleware + cookie reader update simultaneously.
- **M5 (Performance):** Attendance aggregation — needs DB view/RPC migration.
- **L2 (Performance):** Heavy PDF/canvas/xlsx libraries — audit dynamic import usage.

Started: 2026-06-18T08:48:00Z

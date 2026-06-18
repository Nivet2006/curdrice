# Suggested Fixes

## Status Legend
- ✅ DONE — Fix applied and shipped
- ⚠️ NOTED — Documented, not applied (needs careful planning or DB access)

---

## Authentication and TOTP

### ⚠️ NOTED — Bind TOTP verification to a server-issued pending-login challenge
The current route trusts `userId` from the POST body. Proper fix requires issuing a
signed pending-challenge cookie during the password step and validating it in the TOTP
route. The existing 5-attempt / 15-min lockout partially mitigates brute force.

```ts
const pending = await readSignedPendingTotpChallenge(req)
if (!pending || pending.userId !== userId || pending.expiresAt < Date.now()) {
  return NextResponse.json({ message: 'Invalid login challenge' }, { status: 401 })
}
```

### ⚠️ NOTED — Use signed, short-lived, user-bound 2FA cookies
Current cookie is a plain boolean. Requires updating middleware and all downstream cookie readers simultaneously.

---

## RLS Authorization

### ⚠️ NOTED — Restrict manager update/delete policies to own events
Run this as a new migration (`0040_fix_manager_rls.sql`) against the live Supabase project.
Verify that Supabase dashboard policies match before applying.

```sql
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR (role = 'manager' AND events.created_by = auth.uid()))
  )
)
```

---

## Environment Handling

### ✅ DONE — Fail fast when required Supabase environment variables are missing
`lib/supabase/admin.ts` now throws at startup if `NEXT_PUBLIC_SUPABASE_URL` or
`SUPABASE_SERVICE_ROLE_KEY` are missing. `lib/supabase/client.ts` logs a clear console.error.

---

## Frontend Accessibility

### ✅ DONE — OTP input labels and error live regions
`components/auth/TotpCodeInput.tsx` now has:
- `role="group"` + `aria-label="Six digit verification code"` on the container
- `aria-label="Verification code digit N"` on each input
- `autoComplete="one-time-code"` on the first input (enables SMS autofill on iOS/Android)
- `role="alert"` on the error paragraph

---

## Performance

### ✅ DONE — Singleton Supabase browser client
All 21 browser components/hooks migrated from `createClient()` factory to `supabase` singleton.
`[supabase]` removed from all `useEffect` dependency arrays. See commit `5a65cd8b`.

### ⚠️ NOTED — Move attendance counts to aggregate SQL/RPC
Create a DB view or RPC that returns per-event counts. Safe to add as `0040_attendance_summary.sql`
but requires verifying schema state before applying.

```sql
create view event_attendance_summary as
select event_id, count(*) as total_count
from registrations
group by event_id;
```


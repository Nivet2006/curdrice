# Security Audit

Worker: Worker 4 — Security Audit
Scope: auth, middleware, RLS policies, environment handling
Maximum files: 25
Files reviewed:
- app/api/auth/totp/verify-login/route.ts
- lib/supabase/admin.ts
- lib/supabase/client.ts
- lib/auth-guard.ts
- supabase/migrations/0001_rls_policies.sql

## Finding 1 — ✅ DONE

### Title
Role-wide manager RLS allows cross-manager event modification

### Severity
High

### Confidence
High

### Evidence
- File path: `supabase/migrations/0001_rls_policies.sql`
- Function name: RLS policy migration
- Relevant code section: lines 20-28 check only `role IN ('manager', 'admin')` for event update/delete.

### Problem
Authorization is broader than policy names and likely business intent indicate. No ownership condition is present for manager updates/deletes.

### Impact
Managers may alter or delete events outside their responsibility, causing data loss or unauthorized event changes.

### Recommendation
Enforce event ownership in RLS for managers and reserve global mutation privileges for admins.

### Example Fix
```sql
(role = 'admin') OR (role = 'manager' AND events.created_by = auth.uid())
```

## Finding 2 — ✅ DONE

### Title
TOTP verification cookie stores only a global boolean

### Severity
Medium

### Confidence
Medium

### Evidence
- File path: `app/api/auth/totp/verify-login/route.ts`
- Function name: `POST`
- Relevant code section: lines 56-64 set `curdrice_totp_verified` to `'true'` with `httpOnly`, `secure`, `sameSite`, and `path`, but without visible user binding or expiry metadata.

### Problem
The cookie value does not encode or reference the verified user, challenge id, or expiration. The route comments say it expires with the session, but there is no visible binding in this file.

### Impact
If downstream guards only check this boolean, a stale or misplaced cookie could satisfy 2FA for an unintended context. Confidence is medium because downstream guard usage was not fully traced in this audit window.

### Recommendation
Use a signed, short-lived, user-bound verification token and validate it server-side wherever 2FA status matters.

### Example Fix
```ts
cookieStore.set('curdrice_totp_verified', await signTotpToken({ userId, exp }), {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 10 * 60,
  path: '/',
})
```

## Finding 3 — ✅ DONE

### Title
Environment fallbacks obscure missing secrets

### Severity
Medium

### Confidence
High

### Evidence
- File path: `lib/supabase/admin.ts`
- Function name: module initialization
- Relevant code section: lines 3-4 fallback to placeholder Supabase URL and service key.

### Problem
Secret-dependent server code should fail closed if required credentials are absent.

### Impact
Misconfigured deployments may run against placeholders, creating confusing failures and weakening operational security.

### Recommendation
Fail fast for missing `SUPABASE_SERVICE_ROLE_KEY` and Supabase URL in server code.

### Example Fix
```ts
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
```

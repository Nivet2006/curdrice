# Backend Audit

Worker: Worker 2 — Backend Audit
Scope: API routes, server code, services, controllers
Maximum files: 25
Files reviewed:
- app/api/auth/totp/verify-login/route.ts
- app/api/auth/totp/setup/route.ts
- app/api/auth/totp/verify-setup/route.ts
- app/api/auth/totp/disable/route.ts
- lib/actions/auth.ts
- lib/auth-guard.ts
- lib/supabase/admin.ts
- lib/supabase/client.ts

## Finding 1

### Title
TOTP verification API trusts a client-supplied userId

### Severity
High

### Confidence
High

### Evidence
- File path: `app/api/auth/totp/verify-login/route.ts`
- Function name: `POST`
- Relevant code section: lines 8-19 parse `{ code, userId }` from the request body and query `profiles` using `supabaseAdmin` where `id = userId`.

### Problem
The route performs privileged lookup with the service role client based on a client-provided `userId`. It does not bind the TOTP attempt to an authenticated pending login session, signed challenge, nonce, or server-side transaction.

### Impact
Attackers who know or can enumerate a user UUID can target that user's TOTP secret verification endpoint. Rate limiting is stored per profile, but the endpoint still exposes account-level lockout and brute-force surface independently of a verified login challenge.

### Recommendation
Tie TOTP verification to a server-issued pending-login challenge that is created only after password verification. Store the pending challenge server-side or in an encrypted, signed, short-lived cookie and validate that the submitted userId matches it.

### Example Fix
```ts
const pending = await readSignedPendingTotpChallenge(req)
if (!pending || pending.userId !== userId || pending.expiresAt < Date.now()) {
  return NextResponse.json({ message: 'Invalid login challenge' }, { status: 401 })
}
```

## Finding 2

### Title
Production configuration can silently fall back to placeholder Supabase credentials

### Severity
Medium

### Confidence
High

### Evidence
- File path: `lib/supabase/admin.ts`
- Function name: module initialization
- Relevant code section: lines 3-4 use `process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'` and `process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'`.
- File path: `lib/supabase/client.ts`
- Function name: `createClient`
- Relevant code section: lines 5-6 use placeholder URL and anon key fallbacks.

### Problem
Missing environment variables should fail fast. Placeholder fallbacks can hide configuration errors until runtime and may produce misleading network calls or auth failures.

### Impact
Deployments can appear healthy while connected to invalid Supabase settings. Security monitoring and incident response become harder because misconfiguration is not explicit.

### Recommendation
Validate required environment variables during startup and throw a clear error if missing, especially for service role keys.

### Example Fix
```ts
function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}
```

# Suggested Fixes

No fixes were applied. The following are recommendations only.

## Authentication and TOTP
- Bind TOTP verification to a server-issued pending-login challenge.
- Use signed, short-lived, user-bound 2FA cookies or server-side session state.

```ts
const pending = await readSignedPendingTotpChallenge(req)
if (!pending || pending.userId !== userId || pending.expiresAt < Date.now()) {
  return NextResponse.json({ message: 'Invalid login challenge' }, { status: 401 })
}
```

## RLS Authorization
- Restrict manager update/delete policies to records they own.
- Preserve full-table mutation rights only for admins.

```sql
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR (role = 'manager' AND events.created_by = auth.uid()))
  )
)
```

## Environment Handling
- Fail fast when required Supabase environment variables are missing.

```ts
function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}
```

## Frontend Accessibility
- Add OTP input labels and error live regions.

```tsx
<input aria-label={`Verification code digit ${index + 1}`} autoComplete="one-time-code" />
{error && <p role="alert">{error}</p>}
```

## Performance
- Memoize Supabase browser clients used in components.
- Move attendance counts to aggregate SQL/RPC or cached summary data.

```tsx
const supabase = useMemo(() => createClient(), [])
```

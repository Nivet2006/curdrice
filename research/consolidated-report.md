# Consolidated Repository Audit Report

Generated: 2026-06-18T09:06:00Z

## 1. Executive Summary

This audit was executed under `research/AUDIT_INSTRUCTIONS.md`. Exactly 5 worker agents were spawned for frontend, backend, database, security, and performance scopes. The spawned workers remained running without producing artifacts during the audit window, so the coordinator gathered scoped evidence and produced the required five worker-style reports under `research/` to complete the deliverable. No application source code was modified. No fixes, commits, pull requests, dependency updates, file renames, or schema changes were performed.

The repository appears to be a Next.js App Router application using root-level `app/`, `components/`, `lib/`, and `supabase/migrations/`. The most important findings are authorization and authentication weaknesses around RLS manager ownership and TOTP verification, plus a performance issue caused by an unstable Supabase client object in a React component.

Reports generated:
- `research/frontend-audit.md`
- `research/backend-audit.md`
- `research/database-audit.md`
- `research/security-audit.md`
- `research/performance-audit.md`
- `research/critical-issues.md`
- `research/suggested-fixes.md`

## 2. Critical Issues

No Critical severity issues were identified.

## 3. High Priority Issues

### H1: TOTP verification API trusts a client-supplied userId — ⚠️ NOTED
- Source report: `research/backend-audit.md`
- Evidence: `app/api/auth/totp/verify-login/route.ts`, function `POST`, lines 8-19 parse `{ code, userId }` from the request body and query `profiles` using `supabaseAdmin` where `id = userId`.
- Impact: Attackers with a known or guessed user UUID can target the TOTP endpoint and potentially induce lockouts or brute-force attempts outside a verified pending-login challenge.
- Recommendation: Bind verification to a signed, server-issued, short-lived pending-login challenge.
- Confidence: High

### H2: Role-wide manager RLS allows cross-manager event modification — ⚠️ NOTED
- Source reports: `research/database-audit.md`, `research/security-audit.md`
- Evidence: `supabase/migrations/0001_rls_policies.sql`, RLS policy migration, lines 20-28 check only `role IN ('manager', 'admin')` for event update/delete, despite policy names saying "own events".
- Impact: Managers may update or delete events owned by other managers or clubs.
- Recommendation: Add ownership predicates for managers while preserving admin-wide privileges.
- Confidence: High

### H3: Supabase client is recreated during render and used as an effect dependency — ✅ DONE
- Source report: `research/performance-audit.md`
- Evidence: `components/student/StudentEventsView.tsx`, `StudentEventsView`, line 34 calls `createClient()` during render; effects at lines 38-92 and 95-138 depend on `supabase`.
- Impact: Repeated rerenders can cause repeated fetches, realtime subscription churn, and increased Supabase load.
- Recommendation: Memoize the browser client or provide it via a stable provider/hook.
- Confidence: High

## 4. Medium Priority Issues

### M1: Student events view has too many responsibilities — ⚠️ NOTED
- Source report: `research/frontend-audit.md`
- Evidence: `components/student/StudentEventsView.tsx`, `StudentEventsView`, lines 24-183 include state setup, Supabase client creation, attendance fetch, subscriptions, filtering, and grouping.
- Impact: Harder maintenance, higher regression risk, and more complex debugging.
- Recommendation: Extract hooks for subscription, attendance counts, and grouped event derivation.
- Confidence: High

### M2: Production configuration can silently fall back to placeholder Supabase credentials — ✅ DONE
- Source reports: `research/backend-audit.md`, `research/security-audit.md`
- Evidence: `lib/supabase/admin.ts` lines 3-4 and `lib/supabase/client.ts` lines 5-6 use placeholder fallbacks.
- Impact: Misconfigured deployments may appear to run while using invalid credentials.
- Recommendation: Fail fast for missing required environment variables.
- Confidence: High

### M3: Duplicate migration sequence number 0035 — ⚠️ NOTED
- Source report: `research/database-audit.md`
- Evidence: `supabase/migrations/0035_add_registration_stopped.sql` and `supabase/migrations/0035_hackathon_criteria.sql` share prefix `0035`.
- Impact: Migration ordering is less clear for future maintainers and CI environments.
- Recommendation: Ensure future migrations use unique monotonically increasing identifiers and document existing applied order.
- Confidence: High

### M4: TOTP verification cookie stores only a global boolean — ⚠️ NOTED
- Source report: `research/security-audit.md`
- Evidence: `app/api/auth/totp/verify-login/route.ts`, `POST`, lines 56-64 set `curdrice_totp_verified` to `'true'` without visible user binding or expiry metadata.
- Impact: If downstream checks only read the boolean, stale or misplaced state could satisfy 2FA for an unintended context.
- Recommendation: Use signed, short-lived, user-bound verification state.
- Confidence: Medium

### M5: Attendance counts fetch joined registration rows for every event — ⚠️ NOTED
- Source report: `research/performance-audit.md`
- Evidence: `components/student/StudentEventsView.tsx`, `fetchAttendance`, lines 41-47 query all relevant registration rows with joined profile names, then count client-side in lines 50-70.
- Impact: Higher client bandwidth and slower realtime refreshes as attendance scales.
- Recommendation: Use aggregate SQL/RPC/view or cached summary records.
- Confidence: High

## 5. Low Priority Issues

### L1: TOTP digit inputs lack accessible labels — ✅ DONE
- Source report: `research/frontend-audit.md`
- Evidence: `components/auth/TotpCodeInput.tsx`, `TotpCodeInput`, lines 66-81 render six inputs without `aria-label`, `name`, `autocomplete`, or grouped instructions.
- Impact: Screen reader users may struggle to complete 2FA.
- Recommendation: Add labels, grouped semantics, and alert roles.
- Confidence: High

### L2: Heavy document/PDF/canvas/spreadsheet libraries — ⚠️ NOTED
- Source report: `research/performance-audit.md`
- Evidence: `package.json` lines 18-48 include `canvas`, `pdfjs-dist`, `@react-pdf/renderer`, `xlsx`, `exceljs`, `docx`, `html-to-image`, and `chartjs-node-canvas`.
- Impact: Potential bundle size, cold-start, or build-time concerns if imported on common paths.
- Recommendation: Verify dynamic imports and server/client boundary isolation.
- Confidence: Medium

## 6. Documentation Conflicts

### D1: Frontend scope paths in audit instructions do not match repository layout
- Documentation: `research/AUDIT_INSTRUCTIONS.md` lists `src/components/` and `src/pages/` for frontend scope.
- Expected behavior: Those directories exist and contain frontend source.
- Actual behavior: This repository uses root-level `components/` and Next.js App Router `app/`.
- Affected files/directories: `components/`, `app/`, `research/AUDIT_INSTRUCTIONS.md`.

### D2: RLS policy names conflict with implementation
- Documentation-like source: Policy names in `supabase/migrations/0001_rls_policies.sql` say "Managers can update own events" and "Managers can delete own events".
- Expected behavior: Manager updates/deletes are scoped to owned events.
- Actual behavior: The policy condition checks only manager/admin role and does not compare `events.created_by` with `auth.uid()`.
- Affected files: `supabase/migrations/0001_rls_policies.sql`.

## 7. Suggested Fixes

Detailed suggested fixes are stored in `research/suggested-fixes.md`. Summary:
1. Bind TOTP verification to a server-side or signed pending-login challenge.
2. Replace boolean-only TOTP verification cookie with signed user-bound state.
3. Restrict manager RLS update/delete policies to owned events.
4. Fail fast on missing Supabase environment variables.
5. Memoize Supabase browser clients used in React components.
6. Move attendance count aggregation to SQL/RPC/cached summaries.
7. Improve OTP input accessibility.
8. Keep heavy document/PDF libraries out of critical client bundles.

## 8. Code Examples

### Pending TOTP challenge validation
```ts
const pending = await readSignedPendingTotpChallenge(req)
if (!pending || pending.userId !== userId || pending.expiresAt < Date.now()) {
  return NextResponse.json({ message: 'Invalid login challenge' }, { status: 401 })
}
```

### Manager-owned event RLS predicate
```sql
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR (role = 'manager' AND events.created_by = auth.uid()))
  )
)
```

### Required environment validation
```ts
function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}
```

### Stable Supabase client in component
```tsx
const supabase = useMemo(() => createClient(), [])
```

### OTP accessibility improvement
```tsx
<div role="group" aria-label="Six digit verification code">
  <input aria-label="Verification code digit 1" autoComplete="one-time-code" />
</div>
{error && <p role="alert">{error}</p>}
```

## 9. Files Reviewed

### Frontend
- `components/auth/TotpCodeInput.tsx`
- `components/student/StudentEventsView.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `app/auth/totp-verify/page.tsx`
- `components/auth/TotpLoginStep.tsx`
- `components/auth/TotpSettingsCard.tsx`
- `components/auth/TotpSetupWizard.tsx`

### Backend and Security
- `app/api/auth/totp/verify-login/route.ts`
- `app/api/auth/totp/setup/route.ts`
- `app/api/auth/totp/verify-setup/route.ts`
- `app/api/auth/totp/disable/route.ts`
- `lib/actions/auth.ts`
- `lib/auth-guard.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/client.ts`

### Database
- `supabase/migrations/0000_initial_schema.sql`
- `supabase/migrations/0001_rls_policies.sql`
- `supabase/migrations/0013_performance_indexes.sql`
- `supabase/migrations/0020_event_waitlist.sql`
- `supabase/migrations/0035_add_registration_stopped.sql`
- `supabase/migrations/0035_hackathon_criteria.sql`
- `supabase/migrations/0039_hackathon_team_controls.sql`

### Performance
- `components/student/StudentEventsView.tsx`
- `components/iic/InteractivePDFViewer.tsx`
- `components/shared/ImagePreview.tsx`
- `app/admin/bugs/page.tsx`
- `package.json`
- `supabase/migrations/0013_performance_indexes.sql`

## 10. Confidence Levels

- High confidence: TOTP userId trust issue, manager RLS ownership issue, Supabase client render instability, environment fallback issue, duplicate migration prefix, OTP accessibility issue, attendance aggregation inefficiency.
- Medium confidence: Boolean-only TOTP verification cookie downstream impact, heavy dependency bundle impact.
- Low confidence: None recorded.

Audit limitation: exactly 5 worker agents were spawned as required, but they did not produce their own files before timeout. Coordinator evidence was used to complete the mandated deliverables, and this limitation is disclosed here.

## 11. Recommended Next Actions

1. Prioritize fixing the manager event RLS ownership policy.
2. Redesign the TOTP login flow around a signed pending-login challenge.
3. Replace placeholder env fallbacks with required environment validation.
4. Memoize or centralize Supabase browser client creation in client components.
5. Convert attendance counts to database-side aggregation.
6. Improve OTP input accessibility.
7. Document the existing duplicate `0035` migration order and avoid duplicate prefixes going forward.
8. Run a focused import/bundle analysis for PDF, canvas, spreadsheet, and document libraries.

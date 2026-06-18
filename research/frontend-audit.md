# Frontend Audit

Worker: Worker 1 — Frontend Audit
Scope requested: `src/components/`, `src/pages/`
Implementation paths reviewed because requested paths do not exist in this Next.js app: `components/`, `app/`.
Maximum files: 25
Files reviewed:
- components/auth/TotpCodeInput.tsx
- components/student/StudentEventsView.tsx
- app/(auth)/login/page.tsx
- app/(auth)/register/page.tsx
- app/auth/totp-verify/page.tsx
- components/auth/TotpLoginStep.tsx
- components/auth/TotpSettingsCard.tsx
- components/auth/TotpSetupWizard.tsx

## Finding 1 — ✅ DONE

### Title
TOTP digit inputs lack accessible labels

### Severity
Low

### Confidence
High

### Evidence
- File path: `components/auth/TotpCodeInput.tsx`
- Function name: `TotpCodeInput`
- Relevant code section: lines 66-81 render six `<input>` elements with `type="text"`, `inputMode="numeric"`, and visual classes, but no `aria-label`, `name`, `autocomplete`, or grouped instruction semantics.

### Problem
Screen reader users cannot reliably distinguish the six OTP fields. The component also auto-focuses the first input on mount, which can be disorienting without an announced label or description.

### Impact
Users relying on assistive technology may have difficulty completing 2FA. This can block authentication and lowers accessibility compliance.

### Recommendation
Add per-digit labels, a group label, `autoComplete="one-time-code"`, and announce errors with `role="alert"`.

### Example Fix
```tsx
<div role="group" aria-label="Six digit verification code" onPaste={handlePaste}>
  {code.map((digit, index) => (
    <input
      aria-label={`Verification code digit ${index + 1}`}
      autoComplete={index === 0 ? 'one-time-code' : 'off'}
      // existing props
    />
  ))}
</div>
{error && <p role="alert">{error}</p>}
```

## Finding 2 — ⚠️ NOTED (refactor deferred — functional, not broken)

### Title
Student events view combines real-time subscriptions, fetching, filtering, grouping, and UI rendering in one large component

### Severity
Medium

### Confidence
High

### Evidence
- File path: `components/student/StudentEventsView.tsx`
- Function name: `StudentEventsView`
- Relevant code section: lines 24-183 include state setup, Supabase client creation, attendance fetch, real-time registration subscription, real-time events subscription, filtering, and grouping.

### Problem
The component owns too many responsibilities. Data fetching, subscription lifecycle, derived event grouping, and presentation are tightly coupled.

### Impact
This increases maintenance cost and makes routing/state bugs harder to isolate. It also makes performance regressions more likely when adding event display features.

### Recommendation
Extract hooks such as `useStudentEventSubscriptions`, `useAttendanceCounts`, and `useGroupedEvents`, then keep rendering in the component.

### Example Fix
```tsx
const supabase = useMemo(() => createClient(), [])
const attendees = useAttendanceCounts(supabase, events)
const groupedEvents = useGroupedEvents(events, activeTab, searchQuery)
```

## Documentation Conflict
The audit instructions name `src/components/` and `src/pages/`, but this repository uses root-level `components/` and Next.js App Router `app/`. Expected behavior: frontend scope paths exist. Actual behavior: matching implementation files are under `components/` and `app/`.

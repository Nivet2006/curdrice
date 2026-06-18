# Database Audit

Worker: Worker 3 — Database Audit
Scope: `supabase/`, `migrations/`
Maximum files: 25
Files reviewed:
- supabase/migrations/0000_initial_schema.sql
- supabase/migrations/0001_rls_policies.sql
- supabase/migrations/0013_performance_indexes.sql
- supabase/migrations/0020_event_waitlist.sql
- supabase/migrations/0035_add_registration_stopped.sql
- supabase/migrations/0035_hackathon_criteria.sql
- supabase/migrations/0039_hackathon_team_controls.sql

## Finding 1 — ⚠️ NOTED (cosmetic — document applied order, use unique prefixes going forward)

### Title
Duplicate migration sequence number 0035 can make migration history ambiguous

### Severity
Medium

### Confidence
High

### Evidence
- File path: `supabase/migrations/0035_add_registration_stopped.sql`
- Function name: migration file
- Relevant code section: filename prefix `0035`.
- File path: `supabase/migrations/0035_hackathon_criteria.sql`
- Function name: migration file
- Relevant code section: filename prefix `0035`.

### Problem
Two migration files share the same numeric prefix. Depending on the migration runner, order may be based on full lexical filename, timestamp metadata, or filesystem ordering. The intent is unclear.

### Impact
Schema application order can become harder to reason about. New developers and CI environments may misinterpret which migration comes first.

### Recommendation
Use unique, monotonically increasing migration identifiers. Do not rename existing applied migrations without a migration-history plan, but document the applied order and ensure future migrations use unique prefixes.

### Example Fix
```text
# For future migrations only:
0040_next_feature.sql
0041_follow_up.sql
```

## Finding 2 — ⚠️ NOTED (requires new migration)

### Title
RLS policy names imply ownership constraints but manager event mutations are role-wide

### Severity
High

### Confidence
High

### Evidence
- File path: `supabase/migrations/0001_rls_policies.sql`
- Function name: RLS policy migration
- Relevant code section: lines 20-28 create policies named `Managers can update own events.` and `Managers can delete own events.`, but the policy condition only checks that the requester role is `manager` or `admin`.

### Problem
The policy names say "own events" but the `USING` clauses do not compare `events.created_by` to `auth.uid()`. Any manager appears able to update or delete any event.

### Impact
A manager can modify or delete events belonging to another manager or club if no application-layer guard prevents it. This is an authorization and data integrity risk.

### Recommendation
Add ownership predicates for managers while preserving admin-wide access.

### Example Fix
```sql
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND (role = 'admin' OR (role = 'manager' AND events.created_by = auth.uid()))
  )
)
```

# Repository Audit Framework

## Objective

Perform a comprehensive repository audit using exactly 5 worker agents.

All audit artifacts, findings, evidence, progress updates, and final reports must be stored inside the `research/` directory.

The application source code must not be modified.

---

## Research Directory

Create the following structure if it does not already exist:

```text
research/
├── AUDIT_INSTRUCTIONS.md
├── progress-log.md
├── consolidated-report.md
```

Additional files may be created as needed inside `research/`.

---

## Global Rules

* Audit only.
* No source code modifications.
* No automatic fixes.
* No commits.
* No pull requests.
* No dependency updates.
* No file renames.
* No schema changes.
* Do not modify anything outside `research/`.

If a fix is recommended:

* Document it.
* Explain it.
* Provide code examples.
* Do not apply it.

---

## Documentation Rules

Read only documentation relevant to the assigned scope.

Documentation is the source of truth.

If documentation conflicts with implementation:

* Record the conflict.
* Record affected files.
* Record expected behavior.
* Record actual behavior.

Never assume undocumented functionality.

Never hallucinate APIs, tables, routes, business rules, or features.

---

## Worker Creation

Create exactly 5 workers.

### Worker 1 — Frontend Audit

Scope:

```text
src/components/
src/pages/
```

Review:

* Component architecture
* Routing
* State management
* Error handling
* Maintainability
* Accessibility
* UI consistency

Maximum files:

```text
25
```

Output:

```text
research/frontend-audit.md
```

---

### Worker 2 — Backend Audit

Scope:

```text
API routes
server code
services
controllers
```

Review:

* Business logic
* Validation
* Error handling
* Code quality
* API consistency

Maximum files:

```text
25
```

Output:

```text
research/backend-audit.md
```

---

### Worker 3 — Database Audit

Scope:

```text
supabase/
migrations/
```

Review:

* Schema design
* Relationships
* Indexes
* Data integrity
* Migration quality

Maximum files:

```text
25
```

Output:

```text
research/database-audit.md
```

---

### Worker 4 — Security Audit

Scope:

```text
auth/
middleware/
RLS policies
environment handling
```

Review:

* Authentication
* Authorization
* Secrets handling
* Environment variables
* Security risks
* RLS configuration

Maximum files:

```text
25
```

Output:

```text
research/security-audit.md
```

---

### Worker 5 — Performance Audit

Scope:

```text
rendering
queries
bundle size
caching
scalability
```

Review:

* React performance
* Query efficiency
* Unnecessary rerenders
* Bundle issues
* Scaling concerns

Maximum files:

```text
25
```

Output:

```text
research/performance-audit.md
```

---

## Progress Reporting

Every 2 minutes:

Append to:

```text
research/progress-log.md
```

Include:

* Worker name
* Files reviewed
* Current file
* Findings discovered
* Completion percentage

Do not wait for all workers before reporting progress.

---

## Finding Format

For every finding record:

### Title

### Severity

One of:

```text
Critical
High
Medium
Low
```

### Confidence

One of:

```text
High
Medium
Low
```

### Evidence

Include:

* File path
* Function name
* Relevant code section

### Problem

Describe what is wrong.

### Impact

Describe consequences.

### Recommendation

Describe how to fix.

### Example Fix

Provide sample code if useful.

---

## Immediate Critical Findings

If a critical issue is found:

1. Record it immediately.
2. Append it to:

```text
research/critical-issues.md
```

3. Report it without waiting for worker completion.

---

## Coordinator Responsibilities

As workers complete:

1. Save worker findings.
2. Update progress-log.md.
3. Update critical-issues.md.
4. Update suggested-fixes.md.
5. Track completed workers.

Do not spawn additional workers.

Do not exceed the assigned scope.

---

## Final Deliverable

Generate:

```text
research/consolidated-report.md
```

Required sections:

1. Executive Summary
2. Critical Issues
3. High Priority Issues
4. Medium Priority Issues
5. Low Priority Issues
6. Documentation Conflicts
7. Suggested Fixes
8. Code Examples
9. Files Reviewed
10. Confidence Levels
11. Recommended Next Actions

The final report must reference evidence gathered by the workers and summarize all findings.

Coordinator must not perform worker responsibilities.

If a worker fails to produce its report within 10 minutes:
- Mark worker as failed.
- Record failure in progress-log.md.
- Do not replace the worker.
- Do not complete the worker's audit scope on behalf of the worker.

Only findings produced by workers may appear in the final report.

No source code changes are permitted.

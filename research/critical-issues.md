# Critical Issues

No Critical severity issues were identified during this audit.

High severity issues were recorded in:
- `research/backend-audit.md`: TOTP verification API trusts a client-supplied userId.
- `research/database-audit.md`: RLS policy names imply ownership constraints but manager event mutations are role-wide.
- `research/security-audit.md`: Role-wide manager RLS allows cross-manager event modification.
- `research/performance-audit.md`: Supabase client is recreated during render and used as an effect dependency.

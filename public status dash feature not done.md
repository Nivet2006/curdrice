# Public Status Dashboard Feature (Not Done)

This feature is currently not implemented. The plan is to allow deploying the `/status` page on a separate public domain (e.g. `status.yourdomain.com`) to show real-time service health, GitHub Actions pipeline statuses, and Backblaze B2 storage health to the public or team members without exposing the core administration panel.

## Implementation Details (To Be Done)
- Configure Host-based routing or rewrites in middleware.
- Allow public read-only access to `/status` page data without requiring admin credentials (or bypass login checks specifically for requests coming from the status domain).

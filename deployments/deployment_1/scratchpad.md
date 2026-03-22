# Deployment 1 Scratchpad: Vercel Production Setup

**Date:** 2026-03-22
**Status:** In Progress
**Project:** CurdRice (formerly EventHub)

## Pre-deployment Checklist
- [ ] .gitignore verified (ignoring .env and .next)
- [ ] .env.example created for team reference
- [ ] NEXT_PUBLIC_SITE_URL added to local environment
- [ ] middleware.ts reviewed for hardcoded local URLs
- [ ] vercel.json generated with --legacy-peer-deps
- [ ] Local build test successful

## Environment Variables required in Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Important Commands
- `npm run build`
- `git init`, `git add .`, `git commit`, `git push`

## Notes
- Deployment requires `--legacy-peer-deps` due to Next.js 16 -> 14 downgrade.
- Middleware needs absolute URLs for `NextResponse.redirect`, but the `request.url` context handles relative path resolution automatically via `new URL('/path', request.url)`.

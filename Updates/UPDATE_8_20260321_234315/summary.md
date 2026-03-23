# Error Summary: 307 Infinite Redirect Loop (Ghost Profile)

## The Error
The browser became trapped in an infinite `307 Temporary Redirect` loop between `/login` and `/student/dashboard`. The browser constantly requested both URLs until it crashed with `ERR_TOO_MANY_REDIRECTS` or Next.js `fetch failed`.

## What Caused It?
During our previous error (ERROR_4 and ERROR_5), the backend crashed when inserting a user's details into the `profiles` table because of an RLS violation. However, `supabase.auth.signUp()` runs *before* the profile insert, meaning the user account was successfully created in the Supabase `auth.users` table, and the browser was handed a valid authentication cookie!

When the user tried to load the app with this "ghost" session (valid Auth but no Profile):
1. `middleware.ts` saw the Auth token, queried the missing profile, defaulted them to the `student` role, and redirected them from `/login` to `/student/dashboard`.
2. `app/student/layout.tsx` saw the Auth token, queried the missing profile, recognized that they *did not* have a valid student profile, and forcefully redirected them back to `/login`.
This created a perfect infinite trampoline between the client middleware and the server layout.

## How It Was Solved
The `auth.users` table was queried directly using the Supabase MCP integration. The orphaned `nivedshaji2006@gmail.com` account (which had no matching `profiles` row) was deleted via SQL. 
With the user securely purged, the invalid browser token is rejected by `supabase.auth.getUser()`, successfully dropping them safely on the `/login` screen where they can correctly register again.

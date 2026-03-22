# Error Summary: 404 Page Not Found on Redirect

## The Error
After successfully registering a new account, the application redirected the user to `/student/dashboard`. However, Next.js returned a `404 This page could not be found` error instead of loading the dashboard.

## What Caused It?
During the initial project scaffolding phase, the folders for the student and manager flows were created with parentheses: `app/(student)` and `app/(manager)`. 
In Next.js App Router, folders wrapped in parentheses are treated as **Route Groups**. Route Groups deliberately omit their folder name from the final URL path. Therefore, the file `app/(student)/dashboard/page.tsx` was actually resolving to `http://localhost:3000/dashboard`, not `/student/dashboard` as specified in our `PLANNING.md` architecture. When the Auth Server Action explicitly redirected the user to `/student/dashboard`, Next.js naturally could not find it.

## How It Was Solved
The folders were renamed to correctly expose their path segments:
- `app/(student)` → `app/student`
- `app/(manager)` → `app/manager`

After dropping the parentheses, the URL structures perfectly map to `/student/dashboard` and `/manager/dashboard` as intended, instantly resolving the 404 error.

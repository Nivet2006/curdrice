# Error Summary: TypeError: fetch failed (Server Action 307 Redirect Loop)

## The Error
While attempting to submit an authentication Server Action (Login or Register), Next.js crashed with an unhandled runtime error: `TypeError: fetch failed`. The backend terminal showed a continuous stream of `POST /student/dashboard 307` and `failed to forward action response [TypeError: fetch failed] { [cause]: Error at makeNetworkError }`.

## What Caused It?
This error occurred immediately after the core routing directories were renamed on the system (`app/(student)` -> `app/student`). Because the Next.js App Router developmental server (`npm run dev`) was still running and had the old route tree heavily cached in memory, it became severely desynced from the actual file structures.
When the Server Action triggered a `redirect('/student/dashboard')`, Next.js attempted to internally route to a path that the browser's client-side cache believed didn't exist (or was corrupted), dropping the fetch connection and creating a redirect loop.

## How It Was Solved
This is strictly a local developmental caching issue. The solution is:
1. Stop the Next.js development server (`Ctrl+C`).
2. Delete the hidden `.next` folder in the project root to permanently clear the corrupted route tree.
3. Restart the server via `npm run dev`.
4. Perform a Hard Refresh in the browser. Next.js rebuilds the route map perfectly and the redirect executes seamlessly.

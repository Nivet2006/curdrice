# Error Summary: RLS Violation During Sign Up

## The Error
When a student attempted to sign up from `/register`, the Supabase Auth user was successfully created, but the application crashed with a Database Error: `new row violates row-level security policy for table "profiles"`.

## What Caused It?
In Next.js App Router, the `createServerClient()` function authenticates itself by reading cookies from the incoming request. When `supabase.auth.signUp()` successfully creates a user, it passes the new session tokens back to the client via `Set-Cookie` headers. 
However, for the very next line of code inside that *same server action execution block* (inserting the user's data into the `profiles` table), the `supabase` instance was still reading the *incoming* request cookies from before the user existed. Since the `supabase` client was essentially executing the `INSERT` as an Anonymous user with no session context, the Postgres database correctly rejected the request because our RLS rules demand the user inserting the row must strictly equal `auth.uid()`.

## How It Was Solved
We changed `lib/actions/auth.ts` to instantiate a secure `supabaseAdmin` client using the `SUPABASE_SERVICE_ROLE_KEY` to correctly bypass the rigid RLS rules for this one specific operation. This securely injects the `profiles` metadata (Full Name, USN, etc.) cleanly into the database linked to the securely generated `authData.user.id` that Supabase returned upon successful registration.

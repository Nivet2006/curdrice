# Error Summary: Row Level Security Policy Violation

## The Error
When submitting the registration form (after passing Zod validation), the backend crashed with a Supabase database error: `new row violates row-level security policy for table "profiles"`.

## What Caused It?
In the `0000_initial_schema.sql` migration, we enabled Row Level Security (RLS) on all tables via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`. However, because we did not attach any explicit `CREATE POLICY` access controls to the `profiles` table, Supabase defaulted to "deny all". 
When the Server Action attempted to insert the new student profile with the standard browser client, the database rejected the insert.

## How It Was Solved
A new set of comprehensive policies was written in `0001_rls_policies.sql` to explicitly define CRUD access across all tables based on the exact specifications in `PLANNING.md`. 
For `profiles`, this included:
```sql
CREATE POLICY "Users can insert their own profile." 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```
Once run in the Supabase SQL editor, the backend correctly allows users to create their own profiles upon signing up.

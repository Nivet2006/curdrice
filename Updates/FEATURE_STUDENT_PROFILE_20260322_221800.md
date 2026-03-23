# Feature: Student Profile & One-Time Edit (March 22, 2026)

## Overview
Implemented a dedicated student profile management system that allows students to personalize their account details (including a unique username) exactly once. This ensures data consistency for long-term event tracking while giving students control over their initial setup.

## Implementation Details

### 1. Database Schema
- **Tables Changed**: `profiles`
- **New Columns**:
  - `username` (TEXT, UNIQUE): Allows students to set a custom handle (e.g., `@nived`).
  - `profile_edited` (BOOLEAN, DEFAULT FALSE): Tracks whether the student has already used their one-time edit permission.

### 2. Server Action (updateStudentProfile)
- **Validation**:
  - **Uniqueness Check**: Verifies that the chosen username isn't already claimed by another user.
  - **Locking Check**: Prevents anyone with `profile_edited = true` from making further changes.
- **Data Normalization**: Automatically trims strings and converts usernames to lowercase before storage.

### 3. Student Profile UI
- **Live Stats Display**: Integrates server-side logic to fetch and display the total count of registrations and successful check-ins (attendance).
- **Edit Mode**: A dedicated "Edit once" state that switches read-only text into interactive inputs (Username, Full Name, Dept, Sem, Year).
- **Hard-Locked Fields**: USN and Email remain permanent for security and administrative identification.
- **Success Feedback**: Provides clear confirmation that the profile is now permanently locked.

## Navigation Integration
- Added a `Profile` link to the `Navbar` specifically for the `student` role.
- Integrated the `UserCircle` icon representing personal account management.

## Reset & Validation
- **Action**: Performed `pg_notify('pgrst', 'reload schema')` to ensure PostgREST recognizes the new database columns.

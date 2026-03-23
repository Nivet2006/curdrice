# Feature Upgrade: User Details Editing & RLS Bypass

**Date:** 2026-03-22
**Components:** `lib/actions/admin.ts`, `components/admin/UserTable.tsx`

## Overview
Upgraded the core administrative user management logic to ensure full authorized write access to user profiles. This update resolves permission conflicts created by standard RLS policies and provides a new modal-based interface for modifying student details.

## Key Enhancements
1. **Administrative RLS Bypass**:
   - Replaced standard Supabase clients in `updateUserRole` and `deleteUser` server actions with the high-privilege `supabaseAdmin` client.
   - This bypasses the default RLS `UPDATE` policy (`auth.uid() = id`), effectively enabling admins to modify profiles other than their own.
2. **New Edit User Capabilities**:
   - **Standalone Server Action**: Implemented `updateUserDetails` for granular editing of profile metadata (Full Name, USN, Department, etc.).
   - **Modal Integration**: Added a sleek "Edit User" modal to the `UserTable` frontend, accessible via a new Pencil icon button in each row.
   - **Live Refresh**: Integrated `router.refresh()` to ensure the UI immediately reflects saved changes without a manual browser reload.
3. **Data Integrity**: 
   - Included the `year` property in the `Profile` type and ensured all `USN` entries are automatically converted to uppercase for database consistency.

## Environment Reset
A full environment reset (`taskkill`) was performed to ensure the updated server actions and client-side modal logic are functionally synchronized.

# Error/Feature Fix: UserTable State Synchronization

**Date:** 2026-03-22
**Component:** `components/admin/UserTable.tsx`

## Issue
1. **Diverged UI State**: The `UserTable` was not automatically refreshing its contents after successful administrative actions (role changes or suspensions).
2. **Selector Snapping**: The role `<select>` input was a controlled component tied tightly to the `user.role` from props. When a change was requested, the selection would visually snap back to the old value until the server actually updated and the page was manually reloaded.

## Resolution
1. **Instant Data Refresh**: Integrated Next.js `useRouter` hook and implemented `router.refresh()` within the `confirmAction` flow. This forces a server-side data re-fetch immediately upon the completion of a server action transition.
2. **Uncontrolled Role Selector**: 
   - Converted the dropdown to use `defaultValue` instead of `value`.
   - Added a dynamic `key={user.role}` to the `<select>` element. This ensures the component re-mounts with the fresh server data once the underlying model actually changes, effectively resolving the visual snapping bug.
3. **Smooth Transitions**: Actions remain wrapped in `startTransition` to provide a non-blocking user experience while the data revalidation occurs.

## Environment Reset
A full environment reset (`taskkill` and `.next` purge) was executed to ensure the updated component logic and client-side router cache bindings are active.

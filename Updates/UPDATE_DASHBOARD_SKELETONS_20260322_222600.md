# Update: System Dashboard & Skeleton States (March 22, 2026)

## Overview
Upgraded the core platform entry points (Admin, Manager, and Student dashboards) with real-time metrics and a comprehensive skeleton loading system. This ensures that the platform feels responsive and premium even during high-latency database operations.

## Implementation Details

### 1. Root Loading Skeletons
- **Files Created**: `app/admin/loading.tsx`, `app/manager/loading.tsx`, `app/student/loading.tsx`.
- **Logic**: These files handle the primary layout transitions for each role group, showing a pulsated structural preview of the dashboard before the main data hydrate.

### 2. Admin Centre Upgrade
- **Metrics Integrated**:
  - **User Lifecycle**: Total vs. Suspended accounts.
  - **Event Velocity**: Total vs. Active (Upcoming/Ongoing) events.
  - **Platform Throughput**: Global registration and check-in (attendance) counts.
  - **Conversion**: Real-time attendance rate calculation.
- **Quick Actions Grid**: Implemented direct navigation links to high-intent administrative tools (User Management, Attendance, Roster, Scanner, Backup).

### 3. Shared Skeleton Library
- **Component**: `components/shared/SkeletonLoader.tsx`.
- **Refinement**: Switched from static gray colors to dynamic theme variables (`var(--border)`, `var(--bg-card)`). This ensures the "bones" of the application match the Light/Dark mode selected by the user.
- **New Pattern**: Added `SkeletonEventRow` specifically for the Luma-style student calendar timeline.

## Reset & Validation
- **Action**: Performed a fresh `.next` build and environment restart to optimize the common chunks for these shared skeletal assets.

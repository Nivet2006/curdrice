# Club-Eve | Event Management System

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Modern_UI-blue?style=for-the-badge&logo=tailwind-css)

Club-Eve is a premium, full-stack event management platform designed for college clubs and student organizations. It features a multi-tier role system (Student, Manager, Teacher, HOD, PR, CC, Admin), branded QR-based attendance tracking, real-time messaging, a robust approval pipeline, and high-fidelity aesthetics secured by mandatory TOTP 2FA.

---

## Feature Set

### Institutional Identity & Auth
*   **USN-First & 2FA Powered**: Tailored login flow prioritizing University Serial Numbers (USNs) with mandatory **TOTP (Two-Factor Authentication)** for all administrative and faculty roles.
*   **One-Time Edit Profiles**: Specialized `StudentProfile` system restricting cosmetic modifications (Names, USN, vanity usernames) to a strict one-time limit to prevent abuse and impersonation.
*   **Dynamic Event Eligibility**: Deep validation checks ensuring students cannot register for events outside their precise `department`, `semester`, or `year` constraints.
*   **Profile Update Request Workflow**: Students can submit profile change requests via a slider UI that routes to the HOD for approval before being applied.

### Multi-Tier Role-Based Experience
*   **Students**: Browse events, automatically evaluate eligibility, register in one click, receive a **unique branded QR code** for seamless event check-ins, and submit profile update requests.
*   **Managers**: Publish and manage events, enforce registration guardrails, track real-time registration counts, and scan QR codes natively in the browser.
*   **Club Coordinators (CC)**: Design event proposals with survey builders, manage the approval pipeline, submit post-event activity reports, and coordinate peer messaging.
*   **Faculty (Teacher)**: Verify event proposals, manage department students (bulk promote, edit profiles, mark backlogs/yearbacks), and initiate the approval chain.
*   **HOD (Head of Department)**: Final departmental authorization for events, approve/reject student profile update requests, monitor live activities, and export compliance data.
*   **PR (Public Relations)**: Post-event auditing system to verify attendance data and feedback quality before final archival.
*   **Admins**: Full architectural oversight, user role management (verification, promotions, suspensions), combined-sheet exports, and database backup capabilities.

### Teacher Student Management
*   **Department Roster**: Teachers can view all students in their department with real-time status indicators.
*   **Multi-Filter System**: Filter students by semester (1-8) and year (1-4) with multi-select chip toggles and name/USN search.
*   **Bulk Promotion**: Select multiple students and promote them to a target semester/year simultaneously.
*   **Individual Editing**: Edit any student's name, USN, department, semester, year, and mark backlog/yearback flags.

### Sophisticated Attendance Engine
*   **Branded QR Tokens**: Every student registration dynamically generates a unique, encrypted QR code watermarked with the `|||··||` brand mark.
*   **In-Browser Scanning**: Native multi-role React scanner supporting immediate mobile check-ins without downloading extra applications.
*   **Two-Step Confirmation**: Scanner performs a lookup first, displays student details, then requires manual confirmation before marking present.
*   **Client-Side Status Evaluation**: Real-time logical evaluations instantly categorizing events (`upcoming`, `ongoing`, `completed`) without expensive cron jobs.

### Real-Time Messaging & Networking
*   **Event Discussion Threads**: Discord-like per-event group chat with @mention autocomplete, reply threading, emoji reactions, and realtime updates — CC toggles on/off, students auto-joined on registration.
*   **Secure Point-to-Point DMs**: Direct messaging matrix strictly limited to verified students, preserving a safe student networking ecosystem.
*   **Administrative Broadcasts**: Admins and Managers hold global broadcast capabilities to ping all interconnected users simultaneously.
*   **Aesthetic Event Sharing**: Users share sophisticated, self-rendering JSON `[EVENT_CARD]` payloads that manifest as premium functional UI elements inside chat feeds.
*   **Supabase Realtime Integrations**: Employs live WebSocket subscriptions for instant message delivery, optimistic UI updates, and reactive unread badges.

### Advanced Data Pipelines & Exports
*   **Combined Sheet Exports (Admin)**: Generates compound Excel `.xlsx` archives with 8 semester-specific sheets plus a summary dashboard via `ExcelJS`.
*   **Granular Event Analytics (Manager)**: Localized export utilities measuring gross registrations against physically verified QR scans.
*   **System-Wide ZIP Backups**: Instant flat-JSON extraction of the core active database packed into a downloadable `.zip` file for cold storage.

### Premium Modern Design
*   **Global Theme & Pattern Engine**: Deep Light/Dark mode integration alongside a `PatternPicker` enabling users to swap between 10+ dynamic background architectures.
*   **ShieldLoader Authentication**: Full-screen themed overlay with timed security checkpoint animations during login/logout flows.
*   **Mobile Optimized**: Responsive hybrid navigation with hamburger menu and slide-in sidebar for mobile devices.
*   **Premium Brutalist Aesthetic**: High-contrast blacks/whites, sharp geometry, modular card layouts, and monospace typography.

### Eve Bot AI Assistant
*   **Natural Language Processing**: Localized Bayesian NLP engine running at zero cost without external API keys.
*   **Interactive QR Cards**: Secure, contextual QR extraction and rendering within chat using custom `[QR_CARD=]` payloads.
*   **Conversational Commands**: Supports QR retrieval, event exploration, registration queries, profile inspection, and help commands.

---

## Security & Scalability

*   **Supabase SSR Middleware**: Concrete route and layout protection enforced at the server scale before any UI rendering occurs.
*   **Hardened RLS Policies**: Complex Row-Level-Security layers mapped to our custom SQL schema preventing cross-tenant data leaks and unverified role escalations.
*   **Service Role Escalation**: Server Actions use the admin client (`SUPABASE_SERVICE_ROLE_KEY`) only after role verification, bypassing RLS for authorized operations.
*   **Stale Session Purge**: Middleware explicitly clears bad auth cookies and handles "Refresh Token Not Found" errors gracefully.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database & Auth | Supabase (Postgres, RLS, GoTrue Auth, Storage) |
| Styling | Tailwind CSS + CSS Variables (Light/Dark themes) |
| QR System | `qrcode` (Generation) + `html5-qrcode` (Scanning) |
| Exports | `ExcelJS` + `SheetJS` (Attendance Reports) |
| Validation | Zod + React Hook Form |
| Icons | `lucide-react` |
| 2FA | `otplib` v13 (TOTP) |
| Hosting | Vercel |

---

## Project Structure

```
/app          Next.js App Router (Auth, Admin, Manager, Student, Teacher, HOD, PR, CC portals)
/components   Reusable UI components and role-specific views
/lib          Core logic: Supabase clients, server actions, QR engine, utilities
/supabase     Database migrations and RLS policies
/assets       Branding assets and UI screenshots
/public       Static assets (logos, IIC assets, .well-known)
```

See `structure.md` for the full annotated directory tree.

---

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Setup Environment**: Create a `.env.local` file with:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_key
    ```
4.  **Run migrations**: Apply all SQL files from `supabase/migrations/` in your Supabase SQL editor (in order 0000 through 0011).
5.  **Seed first admin**:
    ```sql
    UPDATE profiles SET role = 'admin' WHERE usn = 'YOUR_USN';
    ```
6.  **Start development**:
    ```bash
    npm run dev
    ```

---

## Documentation Index

| File | Description |
|------|-------------|
| `PLANNING.md` | Architecture, database schema, role hierarchy, design system, and implementation phases |
| `ROADMAP.md` | Future features, development vision, and completed milestones |
| `TASK.md` | Active task tracker with completed vs pending items |
| `DESIGN_SYSTEM.md` | Visual tokens, color system, typography, and UI component guidelines |
| `CHANGELOG.md` | Comprehensive feature history, bug fixes, and deployment notes |
| `structure.md` | Annotated directory tree |
| `EveBot-Commands.md` | Eve Bot conversational command reference |
| `future.md` | AI pipeline ideas and experimental feature concepts |
| `cc_android_handoff.md` | Club Coordinator Android app technical guide |
| `pr_android_handoff.md` | PR Android app technical guide |

---

## Branding: The `|||··||` Mark
The `|||··||` mark is the core identity of Club-Eve. It appears on every authentication page, in navigational footers, and is embedded into every generated QR code to ensure authenticity.

---
(c) 2026 Club-Eve Labs. Built for impact.

# Club-Eve | Event Management System

![Club-Eve Banner](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Modern_UI-blue?style=for-the-badge&logo=tailwind-css)

Club-Eve is a premium, full-stack event management platform designed for college clubs and student organizations. It features a robust multi-tier role system (Student, Manager, Teacher, HOD, PR, Admin), branded QR-based attendance tracking, real-time messaging, and high-fidelity aesthetics secured by mandatory TOTP 2FA.

---

## 🚀 Comprehensive Feature Set

### 🎓 Institutional Identity & Auth
*   **USN-First & 2FA Powered**: Tailored login flow prioritizing University Serial Numbers (USNs) with mandatory **TOTP (Two-Factor Authentication)** for all administrative and faculty roles.
*   **One-Time Edit Profiles**: Specialized `StudentProfile` system restricting cosmetic modifications (Names, USN, vanity usernames) to a strict one-time limit to prevent abuse and impersonation.
*   **Dynamic Event Eligibility**: Deep validation checks ensuring students cannot register for events outside their precise `department`, `semester`, or `year` constraints.

### 👤 Multi-Tier Role-Based Experience
*   **Students**: Browse events, automatically evaluate eligibility, register in one click, and receive a **unique branded QR code** for seamless event check-ins.
*   **Managers**: Publish and manage events, enforce registration guardrails, track real-time registration counts, and scan QR codes natively in the browser.
*   **Faculty (Teacher/HOD)**: A sophisticated approval pipeline where Teachers initiate event proposals and HODs provide final departmental authorization.
*   **PR (Public Relations)**: Post-event auditing system to verify attendance data and feedback quality before final archival.
*   **Admins**: Full architectural oversight, user role management (verification, promotions, suspensions), and database backup capabilities.


### 📱 Sophisticated Attendance Engine
*   **Branded QR Tokens**: Every student registration dynamically generates a unique, encrypted QR code watermarked with the `|||··||` brand mark.
*   **In-Browser Scanning**: Native multi-role React scanner supporting immediate mobile check-ins without downloading extra applications.
*   **Client-Side Status Evaluation**: Real-time logical evaluations instantly categorizing events (`upcoming`, `ongoing`, `completed`) without expensive cron jobs.

### 💬 Real-Time Messaging & Networking
*   **Secure Point-to-Point DMs**: Direct messaging matrix strictly limited to verified students, preserving a safe student networking ecosystem.
*   **Administrative Broadcasts**: Admins and Managers hold global broadcast capabilities to ping all interconnected users simultaneously.
*   **Aesthetic Event Sharing**: Delineated from traditional ugly URLs. Users share sophisticated, self-rendering JSON `[EVENT_CARD]` payloads that manifest as premium functional UI elements inside chat feeds.
*   **Supabase Realtime Integrations**: Employs live WebSocket subscriptions for instant message delivery, optimistic UI updates, and reactive unread badges.

### 📊 Advanced Data Pipelines & Exports
*   **Combined Sheet Exports (Admin)**: Powerful backend module generating compound Excel `.xlsx` archives blending metadata, verified user tables, and event attendance logs via `ExcelJS`.
*   **Granular Event Analytics (Manager)**: Localized export utilities measuring gross registrations against physically verified QR scans to automatically extract true attendance percentages.
*   **System-Wide ZIP Backups**: Instant flat-JSON extraction of the core active database packed securely into an downloadable `.zip` file for cold storage.

### 💎 Premium Modern Design
*   **Global Theme & Pattern Engine**: Deep Light/Dark mode integration alongside a `PatternPicker` enabling users to instantly swap between 10+ dynamic background architectures (Grids, Waves, Hexagons).
*   **Website-Wide Pastel Takeover (Easter Egg)**: An embedded secret triggers a procedural HSL color generator, dynamically injecting a global CSS `<style>` block that sweeps through the DOM and transforms the entire application's aesthetic dynamically.
*   **Custom Microinteractions**: Theme-aware `ShieldLoader` systems provide beautifully orchestrated exit animations protecting data during session revocation.
*   **Mobile Optimized**: Responsive navigational architecture providing 100% functionality on mobile devices for on-the-go club management.

---

## 🛡️ Security & Scalability

*   **Supabase SSR Middleware**: Concrete route and layout protection enforced at the server scale before any UI rendering occurs.
*   **Hardened RLS Policies**: Complex Row-Level-Security layers mapped to our custom SQL schema preventing cross-tenant data leaks and unverified role escalations.

---

## 🛠️ Tech Stack

*   **Framework**: Next.js 14 (App Router)
*   **Database & Auth**: Supabase (Postgres, RLS, Storage)
*   **Styling**: Vanilla CSS + Tailwind CSS (Portfolio Aesthetic)
*   **QR System**: `qrcode` (Generation) & `html5-qrcode` (Scanning)
*   **Exports**: `ExcelJS` & `SheetJS` (Attendance Reports)
*   **Validation**: Zod + React Hook Form

---

## 📂 Project Structure

*   `/app`: Next.js App Router (Auth, Admin, Manager, Student portals)
*   `/components`: Reusable UI components and role-specific views
*   `/lib`: Core logic including Supabase clients, server actions, and QR engines
*   `/supabase`: Database migrations and RLS policies
*   `/assets`: Branding assets and generated UI designs

---

## 🏁 Getting Started

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
4.  **Run migrations**: Apply the SQL schemas in your Supabase dashboard.
5.  **Start development**:
    ```bash
    npm run dev
    ```

---

## 🎨 Branding: The `|||··||` Mark
The `|||··||` mark is the core identity of Club-Eve. It appears on every authentication page, in navigational footers, and is embedded into every generated QR code to ensure authenticity.

---
© 2026 Club-Eve Labs. Built for impact.
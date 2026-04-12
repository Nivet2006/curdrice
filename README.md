# Club Eve | Event Management System

![Club Eve Banner](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Modern_UI-blue?style=for-the-badge&logo=tailwind-css)

Club Eve is a premium, full-stack event management platform designed for college clubs and student organizations. It features a robust 3-tier role system, branded QR-based attendance tracking, and high-fidelity aesthetics.

---

## 🚀 Key Features

### 👤 Role-Based Experience
*   **Students**: Browse events, check eligibility (semester/dept/year), register in one click, and receive a **unique branded QR code** for check-ins.
*   **Managers**: Create and manage events, set registration constraints, track real-time registration counts, and scan QR codes for attendance.
*   **Admins**: Full system oversight, user role management (verification/promotions/suspensions), combined attendance exports, and **site-wide backups**.

### 📱 Sophisticated Attendance Engine
*   **Branded QR Tokens**: Every student registration generates a unique QR code watermarked with the `|||··||` brand mark.
*   **In-Browser Scanning**: Multi-role scanner supporting mobile check-ins without extra apps.
*   **Real-time Analytics**: Instant feedback on registration numbers and attendance percentages.

### 💎 Premium Modern Design
*   **Glassmorphism & Patterns**: Dynamic background pattern system with consistent glass architectures.
*   **ShieldLoader**: Custom, theme-aware login/logout animations for a seamless session flow.
*   **Mobile Optimized**: Fully responsive navbar and interactive layouts for on-the-go club management.

### 🛡️ Secure & Scalable
*   **Supabase SSR**: Middleware-level route protection ensured by Supabase Auth and Server Side Rendering.
*   **Row Level Security (RLS)**: Hardened database access ensuring users only see what they are authorized to.
*   **Data Backups**: Admin-only feature to export the entire system state as a structured ZIP (XLSX + Meta).

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
The `|||··||` mark is the core identity of Club Eve. It appears on every authentication page, in navigational footers, and is embedded into every generated QR code to ensure authenticity.

---
© 2026 Club Eve Labs. Built for impact.
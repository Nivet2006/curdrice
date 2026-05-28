# Project Structure

```
Club-Eve
├── app
│   ├── (auth)             # Standard Auth routes (login, register)
│   ├── admin              # Admin Dashboard and tools
│   │   ├── attendance     # QR Attendance tracking
│   │   ├── backup         # Site-wide ZIP backup system
│   │   ├── bugs           # Bug reporting and ticket management
│   │   ├── dashboard      # Admin metrics and charts
│   │   ├── events         # Event management
│   │   ├── logs           # System audit logs & activity trail
│   │   ├── scanner        # Multi-role QR scanner
│   │   ├── security       # IP bans, rate limits, 2FA logs
│   │   └── users          # User management (promote/demote/suspend)
│   ├── api                # Backend API Routes
│   │   ├── admin          # Admin-specific APIs (combined-sheet, etc.)
│   │   ├── auth           # Auth-related APIs (TOTP setup/verify)
│   │   ├── backup         # ZIP Backup generation logic
│   │   ├── hod            # HOD APIs (pending profile requests)
│   │   └── reports        # IIC and activity report compilation APIs
│   ├── auth               # Modern Auth Flow (2FA gates, TOTP verify)
│   ├── cc                 # Club Coordinator features
│   │   ├── dashboard      # CC event pipeline dashboard
│   │   └── events         # Event creation, editing, reports
│   ├── dashboard          # High-level metrics dashboard
│   ├── events             # Event detail pages
│   ├── hod                # HOD (Head of Department) Dashboard
│   │   ├── approvals      # Event approval detail pages
│   │   └── dashboard      # HOD main dashboard with profile request queue
│   ├── manager            # Manager Dashboard and tools
│   │   ├── dashboard      # Manager event stats
│   │   └── events         # Event CRUD, attendance, reports
│   ├── pr                 # PR (Public Relations) auditing dashboard
│   │   ├── dashboard      # PR assignment and audit feed
│   │   ├── events         # Event-specific audit tools
│   │   └── reports        # Report verification workflow
│   ├── reports            # User-facing reporting (IIC report builder)
│   ├── status             # Service health and status checkers
│   ├── student            # Student Hub (events, QR, profile)
│   │   ├── dashboard      # Student event browser
│   │   ├── events         # Event detail + registration + QR
│   │   └── profile        # Profile view + update request slider
│   ├── teacher            # Teacher authorization & student management
│   │   ├── dashboard      # Teacher dashboard with manage students panel
│   │   ├── reports        # Report markup review
│   │   └── verify         # Event verification detail page
│   ├── favicon.ico
│   ├── globals.css        # Core design system & theme vars
│   ├── layout.tsx         # Root layout with providers
│   ├── not-found.tsx      # Custom 404 page
│   └── page.tsx           # Entry redirect logic
├── assets                 # Media artifacts and screenshots
├── components
│   ├── BugReporterWidget.tsx  # Floating overlay widget for in-app bug reports
│   ├── admin              # Admin UI components (UserTable, StatsCard, BackupPanel, etc.)
│   ├── auth               # TOTP and auth-related widgets
│   ├── cc                 # Club Coordinator components
│   ├── common             # Shared UI blocks
│   ├── faculty            # Teacher/Staff components (ManageStudentsPanel, FacultyReviewForm)
│   ├── hod                # HOD components (HODDashboardClient, ProfileUpdateApprovalQueue, ExportButton)
│   ├── iic                # IIC (Institution's Innovation Council) UI modules
│   ├── manager            # Manager tools (EventForm, ConstraintBuilder, etc.)
│   ├── messages           # Real-time messaging (Broadcasts, EveBot)
│   ├── pr                 # PR audit tools
│   ├── reports            # Print-ready and downloadable report designs
│   ├── shared             # Universal components (Navbar, BrandMark, ShieldLoader, ThemeToggle, EveBot)
│   ├── student            # Student UI (EventCards, QR Modal, ProfileUpdateSlider, CalendarView, etc.)
│   └── ui                 # Atomic design components (Button, Card, Input, Modal, Badge, Spinner)
├── deployments            # Deployment logs and configs
├── hooks                  # Custom React hooks (useBugCollector, useUser)
├── lib
│   ├── actions            # Server Actions
│   │   ├── admin.ts       # Admin user management, backup, manual check-in
│   │   ├── audit.ts       # Security audit logging
│   │   ├── audit-mgmt.ts  # Audit management helpers
│   │   ├── auth.ts        # Login, register, logout server actions
│   │   ├── cc-events.ts   # CC event CRUD operations
│   │   ├── eve-bot.ts     # EveBot NLP command processing
│   │   ├── events.ts      # Core event logic (registration, eligibility, profile edit)
│   │   ├── faculty-actions.ts  # Teacher/HOD verification, PR assignment
│   │   ├── manager.ts     # Manager scanner and check-in actions
│   │   ├── messages.ts    # Messaging server actions
│   │   ├── pr-actions.ts  # PR scanning and audit actions
│   │   ├── profile-requests.ts # Student profile update request workflow
│   │   └── teacher-students.ts # Teacher student management (bulk promote, edit)
│   ├── audit              # Security logging and audit handlers
│   ├── supabase           # Client/Server SDK config
│   │   ├── client.ts      # Browser Supabase client
│   │   └── server.ts      # Server-side Supabase client (SSR)
│   ├── utils              # Helper utilities (export.ts, etc.)
│   ├── charts-server.ts   # Server-side data processing for charts
│   ├── event-utils.ts     # Helpers for parsing event schedules/dates
│   ├── qr.ts              # Branded QR generation logic
│   └── types.ts           # Shared TypeScript interfaces and types
├── NATIVE APP             # Native Android/iOS companion apps
│   ├── android            # Android Studio project (Kotlin)
│   ├── ios                # iOS project (Swift)
│   ├── cross-platform     # Expo/React Native cross-platform app
│   ├── README.md          # Setup instructions for mobile apps
│   └── testing_guide.md   # Testing instructions
├── public                 # Static assets (logos, IIC assets, .well-known)
├── supabase
│   └── migrations         # DB Schema migrations (0000-0010)
│       ├── 0000_initial_schema.sql
│       ├── 0001_rls_policies.sql
│       ├── 0002_messaging.sql
│       ├── 0003_clubeve_extension.sql
│       ├── 0004_fix_rls_for_cc.sql
│       ├── 0005_iic_report_schema.sql
│       ├── 0006_bug_reporter_chat.sql
│       ├── 0007_bug_reporter_fixes.sql
│       ├── 0008_enable_rls_iic_tables.sql
│       ├── 0009_add_is_public_to_events.sql
│       └── 0010_student_management.sql
├── TEST                   # Test suites and configurations
│   ├── AUTOMATED          # Automated verification tests
│   └── Playwright         # Playwright end-to-end testing
├── Updates                # Feature and bug-fix changelogs (historical)
├── .env.local             # Local environment variables (not committed)
├── .env.example           # Environment variable template
├── .eslintrc.json         # ESLint configuration
├── .github/workflows/ci.yml # GitHub Actions CI pipeline
├── CHANGELOG.md           # Comprehensive feature history and deployment notes
├── DESIGN_SYSTEM.md       # Visual tokens and design rules
├── EveBot-Commands.md     # EveBot interaction guide
├── PLANNING.md            # Architecture and implementation phases
├── README.md              # Project overview and quickstart
├── ROADMAP.md             # Development status and future goals
├── TASK.md                # Completed vs Pending tasks
├── structure.md           # This file (annotated directory tree)
├── future.md              # AI pipeline ideas and feature concepts
├── cc_android_handoff.md  # CC Android app technical guide
├── pr_android_handoff.md  # PR Android app technical guide
├── middleware.ts           # Route protection by role + stale session handling
├── next.config.mjs        # Next.js configuration
├── package.json           # Dependencies and scripts
├── playwright.config.ts   # Playwright test configuration
├── postcss.config.mjs     # PostCSS/Tailwind configuration
├── tailwind.config.ts     # Tailwind JIT configuration
├── tsconfig.json          # TypeScript configuration with path aliases
├── vercel.json            # Vercel deployment configuration
└── seed.ts                # Database seed script
```

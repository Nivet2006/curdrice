# Project Structure

```
Club-Eve
├── .agents                # AI agent context and configs
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
│   │   ├── admin          # Admin-specific APIs (e.g. combined-sheet)
│   │   ├── auth           # Auth-related APIs (TOTP setup/verify)
│   │   ├── backup         # ZIP Backup generation logic
│   │   └── reports        # IIC and activity report compilation APIs
│   ├── auth               # Modern Auth Flow (2FA gates)
│   ├── cc                 # Club-Eve specific features
│   ├── dashboard          # High-level metrics and events dashboard
│   ├── hod                # HOD (Head of Department) Dashboard
│   ├── manager            # Manager Dashboard and tools
│   ├── pr                 # PR (Public Relations) auditing dashboard
│   ├── reports            # User-facing reporting interfaces (IIC report builder)
│   ├── status             # Service health and status checkers
│   ├── student            # Student Hub (events, QR, profile)
│   ├── teacher            # Teacher authorization dashboard
│   ├── favicon.ico
│   ├── globals.css        # Core design system & theme vars
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Entry redirect logic
├── assets                 # Media artifacts and screenshots
├── components
│   ├── BugReporterWidget.tsx  # Floating overlay widget for in-app bug reports
│   ├── admin              # Admin UI components
│   ├── auth               # TOTP and auth-related widgets
│   ├── cc                 # Club-Eve specific components
│   ├── common             # Shared UI blocks
│   ├── faculty            # Teacher/Staff specific components
│   ├── hod                # HOD dashboard components
│   ├── iic                # IIC (Institution's Innovation Council) UI modules
│   ├── manager            # Manager tools (Event forms, etc.)
│   ├── messages           # Real-time messaging (Broadcasts)
│   ├── pr                 # PR audit tools
│   ├── reports            # Print-ready and downloadable PDF designs (IICReportDocument)
│   ├── shared             # Universal components (BrandMark, EveBot)
│   ├── student            # Student UI (EventCards, QR Modal)
│   └── ui                 # Atomic design components (Button, Card, Input)
├── deployments            # Deployment logs and configs
├── hooks                  # Custom React hooks (useBugCollector, useUser)
├── lib
│   ├── actions            # Server Actions (auth, events, logs, etc.)
│   ├── audit              # Security logging and audit handlers
│   ├── supabase           # Client/Server/Middleware SDK config
│   ├── charts-server.ts   # Server-side data processing for charts
│   ├── event-utils.ts     # Helpers for parsing event schedules/dates
│   ├── qr.ts              # Branded QR generation logic
│   ├── types.ts           # Shared TypeScript interfaces
│   └── utils              # Directory of helper utilities (e.g. export.ts)
├── NATIVE APP             # Native Android/iOS companion apps (Kotlin, Swift, Capacitor/Cordova)
│   ├── android            # Android studio project folder
│   ├── ios                # Xcode project folder
│   ├── cross-platform     # Shared cross-platform library sources
│   ├── README.md          # Setup instructions for mobile apps
│   └── testing_guide.md   # Testing instructions for physical/virtual devices
├── public                 # Static assets folder (logos, IIC assets, etc.)
├── supabase
│   └── migrations         # DB Schema, functions, and RLS policies
├── TEST                   # Test suites and configurations
│   ├── AUTOMATED          # Automated verification tests
│   └── Playwright         # Playwright end-to-end testing environment
├── DESIGN_SYSTEM.md       # Visual tokens and design rules
├── EveBot-Commands.md     # EveBot interaction guide
├── PLANNING.md            # Architecture and implementation phases
├── README.md              # Project overview and quickstart
├── ROADMAP.md             # Development status and future goals
├── TASK.md                # Completed vs Pending tasks
├── handoff.md             # Technical handoff documentation
├── future.md              # Feature ideas and expansions
├── package.json           # Dependencies and scripts
├── tailwind.config.ts     # Tailwind JIT configuration
└── tsconfig.json          # TS configuration with path aliases
```

# Project Structure

```
Club-Eve
├── app
│   ├── (auth)             # Standard Auth routes (login, register)
│   ├── admin              # Admin Dashboard and tools
│   │   ├── attendance     # QR Attendance tracking
│   │   ├── backup         # Site-wide ZIP backup system
│   │   ├── bugs           # Bug reporting and ticket management
│   │   ├── calendar       # Admin Calendar view
│   │   ├── cert           # Certificate generation dashboard
│   │   ├── dashboard      # Admin metrics and charts
│   │   ├── events         # Event management
│   │   ├── logs           # System audit logs & activity trail
│   │   ├── scanner        # Multi-role QR scanner
│   │   ├── security       # IP bans, rate limits, 2FA logs
│   │   └── users          # User management (promote/demote/suspend)
│   ├── api                # Backend API Routes
│   │   ├── admin          # Admin-specific APIs (combined-sheet, etc.)
│   │   ├── assets         # Asset management APIs
│   │   ├── auth           # Auth-related APIs (TOTP setup/verify)
│   │   ├── b2-image       # Backblaze B2 image server endpoints
│   │   ├── backup         # ZIP Backup generation logic
│   │   ├── cert           # Certificate generation API
│   │   ├── debug-teacher  # Teacher flow debugging utility
│   │   ├── events         # Event API routes
│   │   ├── hackathon      # Hackathon configuration/submission endpoints
│   │   ├── hod            # HOD APIs (pending profile requests)
│   │   ├── reports        # IIC and activity report compilation APIs
│   │   └── upload         # Generic file upload endpoint
│   ├── auth               # Modern Auth Flow (2FA gates, TOTP verify)
│   ├── cc                 # Club Coordinator features
│   │   ├── calendar       # CC event calendar
│   │   ├── dashboard      # CC event pipeline dashboard
│   │   └── events         # Event creation, editing, reports
│   ├── dashboard          # High-level metrics dashboard
│   ├── events             # Event detail pages
│   ├── hod                # HOD (Head of Department) Dashboard
│   │   ├── approvals      # Event approval detail pages
│   │   ├── calendar       # HOD calendar view
│   │   ├── dashboard      # HOD main dashboard with profile request queue
│   │   └── reports        # HOD report review view
│   ├── manager            # Manager Dashboard and tools
│   │   ├── attendance     # Manager attendance dashboard
│   │   ├── calendar       # Manager calendar view
│   │   ├── dashboard      # Manager event stats
│   │   ├── events         # Event CRUD, attendance, reports
│   │   └── scanner        # Manager QR scanner check-in portal
│   ├── pr                 # PR (Public Relations) auditing dashboard
│   │   ├── audit          # PR event audit feed
│   │   ├── calendar       # PR calendar view
│   │   ├── dashboard      # PR assignment and audit dashboard
│   │   ├── events         # Event-specific audit tools
│   │   ├── reports        # Report verification workflow
│   │   ├── review         # Review list and details
│   │   └── scanner        # PR QR scanner
│   ├── redirect           # Page routing redirects
│   ├── reports            # User-facing reporting (IIC report builder)
│   ├── status             # Service health and status checkers
│   ├── student            # Student Hub (events, QR, profile)
│   │   ├── arena          # Hackathon Arena (teams, submissions)
│   │   ├── attendance     # Student attendance log
│   │   ├── calendar       # Student personal event calendar
│   │   ├── dashboard      # Student event browser
│   │   ├── events         # Event detail + registration + QR
│   │   └── profile        # Profile view + update request slider
│   ├── teacher            # Teacher authorization & student management
│   │   ├── calendar       # Teacher calendar view
│   │   ├── dashboard      # Teacher dashboard with manage students panel
│   │   ├── events         # Teacher event management
│   │   ├── hackathon      # Teacher hackathon grading and evaluation
│   │   ├── reports        # Report markup review
│   │   └── verify         # Event verification detail page
│   ├── test-scanner       # Scanner debugging and testing view
│   ├── favicon.ico        # Overwritten with logo.png
│   ├── logo.png           # App logo asset
│   ├── globals.css        # Core design system & theme vars
│   ├── layout.tsx         # Root layout with providers
│   ├── not-found.tsx      # Custom 404 page
│   ├── page.tsx           # Entry redirect logic
│   ├── robots.ts          # Search engine crawlers config
│   └── sitemap.ts         # Sitemap generator config
├── assets                 # Media artifacts and screenshots
├── components
│   ├── BugReporterWidget.tsx  # Floating overlay widget for in-app bug reports
│   ├── admin              # Admin UI components (UserTable, StatsCard, BackupPanel, etc.)
│   ├── auth               # TOTP and auth-related widgets
│   ├── cc                 # Club Coordinator components (DiscussionToggle, etc.)
│   ├── cert               # Certificate design templates and preview components
│   ├── common             # Shared UI blocks
│   ├── faculty            # Teacher/Staff components (ManageStudentsPanel, FacultyReviewForm)
│   ├── hod                # HOD components (HODDashboardClient, ProfileUpdateApprovalQueue, ExportButton)
│   ├── iic                # IIC (Institution's Innovation Council) UI modules
│   ├── judge              # Hackathon judging and grading components
│   ├── manager            # Manager tools (EventForm, ConstraintBuilder, etc.)
│   ├── messages           # Real-time messaging (Broadcasts, EveBot)
│   ├── pr                 # PR audit tools
│   ├── reports            # Print-ready and downloadable report designs
│   ├── shared             # Universal components (Navbar, BrandMark, ShieldLoader, ThemeToggle, EveBot)
│   ├── student            # Student UI (EventCards, QR Modal, ProfileUpdateSlider, CalendarView, etc.)
│   │   ├── EventThread.tsx       # Discord-like event discussion chat (@mentions, replies, reactions)
│   │   ├── GamificationSection.tsx # Gamification dashboard (XP, levels, badges)
│   │   ├── TeamFormationPortal.tsx # Real-time hackathon team formation portal
│   │   └── ...
│   ├── teacher            # Teacher event and evaluation components
│   └── ui                 # Atomic design components (Button, Card, Input, Modal, Badge, Spinner)
├── deployments            # Deployment logs and configs
├── hooks                  # Custom React hooks (useBugCollector, useUser)
├── lib
│   ├── actions            # Server Actions
│   │   ├── admin.ts       # Admin user management, backup, manual check-in
│   │   ├── audit.ts       # Security audit logging
│   │   ├── audit-mgmt.ts  # Audit management helpers
│   │   ├── auth.ts        # Login, register, logout server actions
│   │   ├── bypass.ts      # Auth bypass actions for testing
│   │   ├── cc-events.ts   # CC event CRUD operations
│   │   ├── cert-actions.ts # Certificate template and generation actions
│   │   ├── club-actions.ts # Club creation and management actions
│   │   ├── eve-bot.ts     # EveBot NLP command processing
│   │   ├── events.ts      # Core event logic (registration, eligibility, profile edit, auto-join thread)
│   │   ├── event-threads.ts # Event discussion thread actions (toggle, join, messages, reactions, @mentions)
│   │   ├── faculty-actions.ts  # Teacher/HOD verification, PR assignment
│   │   ├── gamification-actions.ts # Gamification, level up and badge rewards
│   │   ├── hackathon-actions.ts # Hackathon team formation & submission actions
│   │   ├── hackathon-eval-actions.ts # Hackathon scoring and criteria actions
│   │   ├── iic-approvals.ts # HOD approvals logic for IIC reports
│   │   ├── manager.ts     # Manager scanner and check-in actions
│   │   ├── messages.ts    # Messaging server actions
│   │   ├── pr-actions.ts  # PR scanning and audit actions
│   │   ├── profile-requests.ts # Student profile update request workflow
│   │   ├── teacher-events.ts # Teacher event approvals and management actions
│   │   ├── teacher-students.ts # Teacher student management (bulk promote, edit)
│   │   └── venue-actions.ts # Venue booking and policies management
│   ├── audit              # Security logging and audit handlers
│   ├── cert               # PDF certificate generation engines
│   ├── supabase           # Client/Server SDK config
│   │   ├── client.ts      # Browser Supabase client
│   │   └── server.ts      # Server-side Supabase client (SSR)
│   ├── utils              # Helper utilities (export.ts, etc.)
│   ├── auth-guard.ts      # Route guard utility functions
│   ├── b2.ts              # Backblaze B2 client configuration
│   ├── charts-server.ts   # Server-side data processing for charts
│   ├── custom-background.ts # Handler for custom event themes and banners
│   ├── event-utils.ts     # Helpers for parsing event schedules/dates
│   ├── fonts-list.ts      # Standard fonts configuration list
│   ├── qr.ts              # Branded QR generation logic
│   ├── totp-challenge.ts  # 2FA / TOTP challenge verification helpers
│   └── types.ts           # Shared TypeScript interfaces and types
├── logos                  # Brand asset logo files
├── MOBILE WEB APP         # Mobile PWA / Web companion app
│   ├── IMPLEMENTATION_PLAN.md # PWA strategy and architecture
│   └── TASK_LIST.md       # Mobile features checklist
├── public                 # Static assets (logos, IIC assets, .well-known)
├── supabase
│   └── migrations         # DB Schema migrations (0000-0041)
│       ├── 0000_initial_schema.sql
│       ├── 0001_rls_policies.sql
│       ├── 0002_messaging.sql
│       ├── ...
│       ├── 0033_hackathon_teams.sql
│       ├── ...
│       └── 0041_add_email_to_profiles.sql
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
├── IMPLEMETATION CERT GEN.MD # Certificate generator implementation notes
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
├── proxy.ts               # Proxy configuration
├── public status dash feature not done.md # Missing feature draft
├── implementation_plan.md # Development execution plan
└── seed.ts                # Database seed script
```

# Project Structure

```
Club-Eve
├── .agents                # AI agent context and configs
├── app
│   ├── (auth)             # Standard Auth routes (login, register)
│   ├── admin              # Admin Dashboard and tools
│   │   ├── attendance     # QR Attendance tracking
│   │   ├── backup         # Site-wide ZIP backup system
│   │   ├── dashboard      # Admin metrics
│   │   ├── events         # Event management
│   │   ├── users          # User management (promote/demote/suspend)
│   │   └── scanner        # Multi-role QR scanner
│   ├── api                # Backend API Routes
│   │   ├── admin          # Admin-specific APIs (e.g. combined-sheet)
│   │   ├── auth           # Auth-related APIs
│   │   │   └── totp       # 2FA / TOTP (setup, verify, disable)
│   │   └── backup         # ZIP Backup generation logic
│   ├── auth               # Modern Auth Flow (2FA gates)
│   ├── cc                 # Club-Eve specific features
│   ├── hod                # HOD (Head of Department) Dashboard
│   ├── manager            # Manager Dashboard and tools
│   ├── pr                 # PR (Public Relations) auditing dashboard
│   ├── student            # Student Hub (events, QR, profile)
│   ├── teacher            # Teacher authorization dashboard
│   ├── favicon.ico
│   ├── globals.css        # Core design system & theme vars
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Entry redirect logic
├── assets                 # Media artifacts and screenshots
├── components
│   ├── admin              # Admin UI components
│   ├── auth               # TOTP and auth-related widgets
│   ├── cc                 # Club-Eve specific components
│   ├── common             # Shared UI blocks
│   ├── faculty            # Teacher/Staff specific components
│   ├── hod                # HOD dashboard components
│   ├── manager            # Manager tools (Event forms, etc.)
│   ├── messages           # Real-time messaging (Broadcasts)
│   ├── pr                 # PR audit tools
│   ├── shared             # Universal components (BrandMark, EveBot)
│   ├── student            # Student UI (EventCards, QR Modal)
│   └── ui                 # Atomic design components (Button, Card, Input)
├── deployments            # Deployment logs and configs
├── lib
│   ├── actions            # Server Actions (auth, events, etc.)
│   ├── supabase           # Client/Server/Middleware SDK config
│   ├── qr.ts              # Branded QR generation logic
│   ├── types.ts           # Shared TypeScript interfaces
│   └── utils.ts           # Shared helper functions
├── supabase
│   └── migrations         # DB Schema and RLS policies
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

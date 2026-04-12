# Project Structure

```
Curdrice
├── .agents
│   └── workflows
│       └── 22-03-2026
│           └── EventHub-Comprehensive-Handoff.md
├── app
│   ├── (auth)
│   │   ├── login
│   │   │   └── page.tsx
│   │   └── register
│   │       └── page.tsx
│   ├── admin
│   │   ├── attendance
│   │   │   ├── [id]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── backup
│   │   │   └── page.tsx
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   ├── events
│   │   │   └── page.tsx
│   │   ├── scanner
│   │   │   └── page.tsx
│   │   ├── users
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api
│   │   ├── admin
│   │   │   └── combined-sheet
│   │   │       └── route.ts
│   │   └── backup
│   │       └── route.ts
│   ├── fonts
│   │   ├── GeistMonoVF.woff
│   │   └── GeistVF.woff
│   ├── manager
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   ├── events
│   │   │   ├── [id]
│   │   │   │   ├── edit
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── create
│   │   │       └── page.tsx
│   │   ├── scanner
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── student
│   │   ├── dashboard
│   │   │   └── page.tsx
│   │   ├── events
│   │   │   ├── [id]
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── profile
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── assets
│   ├── Browse_Events.png
│   ├── Event_Details__Registration.png
│   ├── EventHub__Login.png
│   ├── EventHub__QR_Modal.png
│   ├── EventHub__Register.png
│   └── Student_Dashboard.png
├── components
│   ├── admin
│   │   ├── AttendanceManager.tsx
│   │   ├── CombinedSheetButton.tsx
│   │   ├── CreateUserModal.tsx
│   │   ├── UserExportMenu.tsx
│   │   └── UserTable.tsx
│   ├── manager
│   │   ├── EditEventForm.tsx
│   │   ├── QRScanner.tsx
│   │   └── RegistrationExportMenu.tsx
│   ├── shared
│   │   ├── BrandMark.tsx
│   │   ├── Navbar.tsx
│   │   ├── PatternPicker.tsx
│   │   ├── PatternProvider.tsx
│   │   └── ThemeToggle.tsx
│   ├── student
│   │   ├── DashboardEventTabs.tsx
│   │   ├── EventCard.tsx
│   │   ├── QRButton.tsx
│   │   ├── QRDisplay.tsx
│   │   └── RegisterButton.tsx
│   └── ui
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── Updates
│   ├── FEATURE_ELIGIBILITY_20260322_160419.md
│   ├── FEATURE_QR_UPGRADE_20260322_162849.md
│   ├── FEATURE_USER_VERIFICATION_20260322_163820.md
│   ├── FEATURE_THEME_20260322_184836.md
│   ├── FEATURE_UI_CONSISTENCY_20260322_190600.md
│   ├── FEATURE_USERTABLE_SYNC_20260322_192355.md
│   ├── FEATURE_USER_EDITING_20260322_192926.md
│   ├── FEATURE_THEME_REFINEMENT_20260322_193844.md
│   ├── FEATURE_THEME_RED_ALERT_20260322_194306.md
│   ├── FEATURE_MOBILE_NAVBAR_20260322_212800.md
│   ├── FEATURE_STUDENT_PROFILE_20260322_221800.md
│   ├── UPDATE_DASHBOARD_SKELETONS_20260322_222600.md
│   ├── FEATURE_ROBUST_AUTH_20260412_150200.md
│   ├── FEATURE_COMBINED_SHEET_20260412_163000.md
│   ├── UPDATE_1_20260321_222343
│   ├── UPDATE_2...UPDATE_22 (historical logs)
├── lib
│   ├── actions
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   └── manager.ts
│   ├── supabase
│   │   ├── client.ts
│   │   └── server.ts
│   ├── qr.ts
│   └── types.ts
├── supabase
│   └── migrations
│       ├── 0000_initial_schema.sql
│       └── 0001_rls_policies.sql
├── handoff.md
├── PLANNING.md
├── middleware.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

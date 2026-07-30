# 📋 Club-Eve (Curdrice) — Master Pending Tasks & Roadmap Audit

> **Consolidated Master Plan**  
> *Last Synthesized: July 30, 2026*  
> This document aggregates all open tasks, planned modules, security/performance audit findings, mobile optimizations, institutional feature requests, and zero-budget AI roadmaps from across the repository.

---

## 📑 Table of Contents
1. [Immediate & Incomplete Features](#1-immediate--incomplete-features)
2. [Mobile Responsiveness & UI Audit](#2-mobile-responsiveness--ui-audit)
3. [Ultimate GitHub Scanner Suite](#3-ultimate-github-scanner-suite)
4. [Security, RLS & Performance Audit Fixes](#4-security-rls--performance-audit-fixes)
5. [Institutional / GCEM Administrative Flow Features](#5-institutional--gcem-administrative-flow-features)
6. [Future Zero-Budget Autonomous AI Pipelines](#6-future-zero-budget-autonomous-ai-pipelines)
7. [Source File Index & Cross-References](#7-source-file-index--cross-references)

---

## 📌 1. Immediate & Incomplete Features

*Source: [`NOT DONE/public status dash feature not done.md`](file:///c:/codingprojects/Curdrice/NOT%20DONE/public%20status%20dash%20feature%20not%20done.md)*

### Public Status Dashboard (`/status`)
- [ ] **Middleware Host Rewrites**: Configure host-based routing / rewrites in `proxy.ts` middleware for a custom public domain (e.g. `status.yourdomain.com`).
- [ ] **Public Read-Only Access**: Grant bypass of admin authentication specifically for requests coming from the status domain.
- [ ] **Real-time Health Feed**: Expose service health metrics, GitHub Actions build/pipeline statuses, and Backblaze B2 storage connectivity status on the public page without granting access to internal management panels.

---

## 📱 2. Mobile Responsiveness & UI Audit

*Source: [`MOBILE WEB APP/TASK_LIST.md`](file:///c:/codingprojects/Curdrice/MOBILE%20WEB%20APP/TASK_LIST.md) & [`MOBILE WEB APP/IMPLEMENTATION_PLAN.md`](file:///c:/codingprojects/Curdrice/MOBILE%20WEB%20APP/IMPLEMENTATION_PLAN.md)*

### Phase 1: Global Foundation & Breakpoints
- [x] **Layout Padding Refactor**: Replace hardcoded `px-8 py-10` with responsive utility classes (`px-4 sm:px-6 md:px-8 py-6 md:py-10`) in:
  - [x] `app/student/layout.tsx`
  - [x] `app/teacher/layout.tsx`
  - [x] `app/admin/layout.tsx`
  - [x] `app/cc/layout.tsx`
  - [x] `app/manager/layout.tsx`
  - [x] `app/pr/layout.tsx`
  - [x] `app/hod/layout.tsx`
- [x] **Navbar Mobile Optimization**:
  - [x] Hide `PatternPicker` on small viewports (`hidden sm:block`).
  - [x] Hide role `Badge` on mobile screens (`hidden sm:flex`).
  - [x] Adjust user button padding and set flex gap to `gap-1 sm:gap-2 md:gap-3`.
- [x] **Global CSS Rules (`globals.css`)**:
  - [x] Add `overflow-x: hidden` to root body on mobile.
  - [x] Add touch highlight suppression for iOS/Android.
  - [x] Enforce minimum `font-size: 16px` on input elements at mobile breakpoints to prevent automatic iOS zoom.

### Phase 2: Auth & Core Portals
- [x] **Login & Registration Pages**: Replace absolute position headers with flex rows and constrain test credential cards to `max-w-[280px]`.
- [x] **Student Dashboard & Events Timeline**:
  - [x] Enable smooth horizontal touch scrolling (`-webkit-overflow-scrolling: touch`) for event cards.
  - [x] Scale Event Card min-widths (`min-w-[260px] sm:w-[350px]`).
  - [x] Stack timeline event posters (`order-first md:order-last` & `h-[160px] w-full md:w-[130px]`).
- [x] **Attendance & Gamification Tables**:
  - [x] Implement mobile card view for attendance (`StudentAttendanceClient.tsx`) for viewports below `md`.
  - [x] Scale leaderboard grid columns for narrow screens (`grid-cols-[40px_1fr_80px]` vs desktop `grid-cols-[60px_1fr_120px_100px_120px]`).

---

## 🛠️ 3. Ultimate GitHub Scanner Suite

*Source: [`github_scanner_plan.md`](file:///c:/codingprojects/Curdrice/github_scanner_plan.md)*

### Architectural Blueprint & Backend Service
- [ ] **Create GitHub Scanner Service (`lib/services/github-scanner.ts`)**:
  - [ ] `verifyRepo(owner, repo)`: Validate repository visibility and accessibility.
  - [ ] `fetchCommitTimeline(...)`: Fetch commit history and line additions/deletions.
  - [ ] `scanForSecrets(rawText)`: Regex detector for exposed keys (Supabase, AWS, DB URIs, Firebase).
  - [ ] `computeJaroWinkler(str1, str2)`: String distance metric for plagiarism scoring.
  - [ ] `parseArchitecture(tree)`: Auto-detect stack (Next.js, FastAPI, Prisma, Supabase).

### Database Schema Migration
- [ ] **Create Migration `0042_github_scanner_data.sql`**:
  ```sql
  ALTER TABLE hackathon_submissions 
  ADD COLUMN IF NOT EXISTS git_scan_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS git_commit_velocity jsonb,
  ADD COLUMN IF NOT EXISTS git_work_distribution jsonb,
  ADD COLUMN IF NOT EXISTS git_architecture jsonb,
  ADD COLUMN IF NOT EXISTS git_security_warnings jsonb,
  ADD COLUMN IF NOT EXISTS git_plagiarism_index double precision DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS git_readme_content text;
  ```

### Functional Modules
- [ ] **Commit Velocity & Heatmap**: Pre-built codebase detection by analyzing line addition spikes.
- [ ] **Plagiarism Detector**: TF-IDF tokenization & Cosine similarity scoring across submissions.
- [ ] **Secret Scanner Banner**: Live safety warnings in student portals if credentials are leaked.
- [ ] **Auto System Architecture Mapper**: Dynamic Mermaid diagram generation (`Frontend -> Backend -> DB`).
- [ ] **Contributor Work-Distribution Audit**: Team commit and line addition percentage breakdown for judges.

---

## 🔍 4. Security, RLS & Performance Audit Fixes

*Source: `research/` directory ([`critical-issues.md`](file:///c:/codingprojects/Curdrice/research/critical-issues.md), [`backend-audit.md`](file:///c:/codingprojects/Curdrice/research/backend-audit.md), [`security-audit.md`](file:///c:/codingprojects/Curdrice/research/security-audit.md), [`database-audit.md`](file:///c:/codingprojects/Curdrice/research/database-audit.md), [`performance-audit.md`](file:///c:/codingprojects/Curdrice/research/performance-audit.md))*

### Security & Authentication
- [ ] **TOTP Endpoint Verification Fix**: Update TOTP verification API to read `userId` from validated server auth session instead of trusting client-supplied payloads.
- [ ] **Role-Wide Manager RLS Tightening**: Update RLS policies on `events` and `club_showcase_configs` so Club Managers can only update resources matching their assigned `club_id`.

### Performance & Client Lifecycle
- [ ] **Supabase Client Instantiation**: Remove inline `createClient()` calls inside component render loops; standardize on singleton hooks or memoized context providers to avoid redundant connections.

---

## 🏛️ 5. Institutional / GCEM Administrative Flow Features

*Source: [`ROADMAP.md`](file:///c:/codingprojects/Curdrice/ROADMAP.md)*

### Teacher & Faculty Tools
- [ ] **Draft Event Saving**: Allow teachers to save draft event proposals with a maximum cap of 5 drafts (auto-deleting or archiving older drafts).
- [ ] **Faculty Proposal Fast-Track**: Fast-track proposal pipeline for faculty guest lectures/talks (bypassing CC/PR review, routing straight to HOD -> direct student registration).
- [ ] **Faculty-Led Post-Event Auditing**: Allow faculty-created event reports to route directly to HOD review, bypassing PR audit steps.

### Targeted Student Operations
- [ ] **Compulsory / Closed Event Auto-Registration**: Option to forcefully auto-register targeted student groups for mandatory events with direct QR generation.
- [ ] **Open + Compulsory Hybrid Registrations**: Flag allowing compulsory pre-registration for target groups while keeping remaining capacity open for manual student signups.

---

## 🔮 6. Future Zero-Budget Autonomous AI Pipelines

*Source: [`future.md`](file:///c:/codingprojects/Curdrice/future.md)*

- [ ] **Curated Matchmaking Engine**: Personalized event recommendation carousel using TF-IDF / vector scoring on student registration history.
- [ ] **Automated Description Tagging**: Auto-generate tags (`#Technology`, `#Workshop`, `#Social`) from raw event descriptions via local Bayes Classifier.
- [ ] **Sentiment Evaluator for Admin Inbox**: Auto-score student feedback sentiment (`-1.0` to `+1.0`) to pin urgent/frustrated messages at the top of the admin queue.
- [ ] **Toxicity & Profanity Filter**: Client/Server-side local text interception blocking vulgar DMs and discussion messages with popup warnings.
- [ ] **Demand & Capacity Forecasting**: Linear regression model predicting event turnout velocity and alerting managers when capacity will be breached.
- [ ] **Jaro-Winkler Typo Correction in Eve Bot**: Automatic suggestion ("Did you mean *Change my username*?") for mistyped bot queries.

---

## 📂 7. Source File Index & Cross-References

- 📌 **Immediate Incomplete Feature**: [`NOT DONE/public status dash feature not done.md`](file:///c:/codingprojects/Curdrice/NOT%20DONE/public%20status%20dash%20feature%20not%20done.md)
- 📱 **Mobile Responsiveness Task List**: [`MOBILE WEB APP/TASK_LIST.md`](file:///c:/codingprojects/Curdrice/MOBILE%20WEB%20APP/TASK_LIST.md)
- 📱 **Mobile Implementation Strategy**: [`MOBILE WEB APP/IMPLEMENTATION_PLAN.md`](file:///c:/codingprojects/Curdrice/MOBILE%20WEB%20APP/IMPLEMENTATION_PLAN.md)
- 🛠️ **GitHub Scanner Implementation Plan**: [`github_scanner_plan.md`](file:///c:/codingprojects/Curdrice/github_scanner_plan.md)
- 🔍 **Critical Issues Summary**: [`research/critical-issues.md`](file:///c:/codingprojects/Curdrice/research/critical-issues.md)
- 🔍 **Backend Audit Report**: [`research/backend-audit.md`](file:///c:/codingprojects/Curdrice/research/backend-audit.md)
- 🔍 **Security Audit Report**: [`research/security-audit.md`](file:///c:/codingprojects/Curdrice/research/security-audit.md)
- 🔍 **Database & RLS Audit Report**: [`research/database-audit.md`](file:///c:/codingprojects/Curdrice/research/database-audit.md)
- 🔍 **Performance Audit Report**: [`research/performance-audit.md`](file:///c:/codingprojects/Curdrice/research/performance-audit.md)
- 🏛️ **Platform Development Roadmap**: [`ROADMAP.md`](file:///c:/codingprojects/Curdrice/ROADMAP.md)
- 🔮 **Future AI Architecture Guide**: [`future.md`](file:///c:/codingprojects/Curdrice/future.md)

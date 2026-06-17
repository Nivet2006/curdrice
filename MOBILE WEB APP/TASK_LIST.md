# 📱 Mobile Responsiveness Task List
**Project**: Club-Eve (Curdrice)  
**Goal**: Make the entire platform ultra-responsive and mobile-friendly

---

## PHASE 1 — Global Foundation

- [ ] **1.1** Fix `px-8 py-10` → `px-4 sm:px-6 md:px-8 py-6 md:py-10` in `app/student/layout.tsx`
- [ ] **1.1** Fix `px-8 py-10` → responsive in `app/teacher/layout.tsx`
- [ ] **1.1** Fix `px-8 py-10` → responsive in `app/admin/layout.tsx`
- [ ] **1.1** Fix `px-8 py-10` → responsive in `app/cc/layout.tsx`
- [ ] **1.1** Fix `px-8 py-10` → responsive in `app/manager/layout.tsx`
- [ ] **1.1** Fix `px-8 py-10` → responsive in `app/pr/layout.tsx`
- [ ] **1.1** Fix `px-8 py-10` → responsive in `app/hod/layout.tsx`
- [ ] **1.2** Fix Navbar right-side overflow on mobile (`Navbar.tsx`)
  - [ ] Hide `PatternPicker` on mobile (`hidden sm:block`)
  - [ ] Hide role `Badge` on mobile (`hidden sm:flex`)
  - [ ] Reduce user button padding on mobile
  - [ ] Cap gap: `gap-1 sm:gap-2 md:gap-3`
- [ ] **1.3** Add mobile CSS rules to `globals.css`
  - [ ] Add tap highlight removal
  - [ ] Add `overflow-x: hidden` on mobile body
  - [ ] Add safe-area-inset utility classes
  - [ ] Fix iOS input zoom: `font-size: 16px` on all inputs at mobile breakpoint

---

## PHASE 2 — Auth Pages

- [ ] **2.1** Login page (`app/(auth)/login/page.tsx`)
  - [ ] Replace `absolute` header with proper flex header row
  - [ ] Responsive card padding `px-5 py-8 sm:px-8 sm:py-10`
  - [ ] Fix test credentials panel: add `max-w-[280px]`
- [ ] **2.2** Register page — responsive audit

---

## PHASE 3 — Student Role Pages

### Dashboard
- [ ] **3.1** `app/student/dashboard/page.tsx`
  - [ ] `mb-12` → `mb-6 md:mb-12`
  - [ ] EventCard min-width: `min-w-[260px] sm:w-[350px]`
  - [ ] Add smooth horizontal scroll (`-webkit-overflow-scrolling: touch`)

### Events Timeline
- [ ] **3.2** `components/student/StudentEventsView.tsx`
  - [ ] Date column: `w-[64px] md:w-[100px]`
  - [ ] Event poster: `order-first md:order-last` + `h-[160px] w-full md:w-[130px] md:h-[130px]`
  - [ ] Title: `text-base md:text-xl`
  - [ ] Search bar: `w-full md:w-[280px]`
  - [ ] Tab buttons: ensure 44px min height

### Event Detail (Chat + Team + Hackathon)
- [ ] **3.3** `components/student/EventThread.tsx`
  - [ ] Height: `h-[400px] sm:h-[500px] md:h-[560px]`
  - [ ] Message actions: always visible on mobile `opacity-100 md:opacity-0 md:group-hover:opacity-100`
  - [ ] Input bar: `py-3` for better touch target
  - [ ] Reaction picker: prevent viewport clipping

### Team Formation
- [ ] **3.4** `components/student/TeamFormationPortal.tsx`
  - [ ] Card sections: `p-4 md:p-6`
  - [ ] All buttons: minimum `h-11` (44px)
  - [ ] Search inputs: `w-full`

### Attendance
- [ ] **3.5** `components/student/StudentAttendanceClient.tsx` ⚠️ CRITICAL
  - [ ] Add mobile card view (hidden on `md+`)
  - [ ] Keep desktop table (hidden on `< md`)
  - [ ] Heading: `text-3xl md:text-4xl`

### Profile
- [ ] **3.6** `components/student/StudentProfileClient.tsx`
  - [ ] Form grid: `grid-cols-1 sm:grid-cols-2`
  - [ ] Buttons: full width on mobile

### Arena / Gamification
- [ ] **3.7** `components/student/GamificationSection.tsx` ⚠️ CRITICAL
  - [ ] Leaderboard: mobile `grid-cols-[40px_1fr_80px]` / desktop `grid-cols-[60px_1fr_120px_100px_120px]`
  - [ ] Tab row: `overflow-x-auto` to prevent clipping
  - [ ] Header stats: `grid-cols-1 sm:grid-cols-3` ✓ (already OK)

### Calendar
- [ ] **3.8** `components/shared/EventCalendar.tsx`
  - [ ] Cell padding: reduce on mobile
  - [ ] Navigation buttons: 44px targets

---

## PHASE 4 — Teacher Role Pages

- [ ] **4.1** `components/teacher/EditableVerifyDetails.tsx`
  - [ ] Category grid: `grid-cols-2 sm:grid-cols-3`
  - [ ] Semester toggles: 44px touch targets
  - [ ] All form inputs: `w-full`
- [ ] **4.2** `components/teacher/EditEventForm.tsx` — responsive form
- [ ] **4.3** `components/teacher/DraftManager.tsx` — responsive
- [ ] **4.4** Teacher reports page — table responsive

---

## PHASE 5 — Hackathon Configuration

- [ ] **5.1** `components/student/HackathonConfigPanel.tsx`
  - [ ] Section cards: `p-4 md:p-6`
  - [ ] Submission config: `grid-cols-1 sm:grid-cols-2`
  - [ ] Toggle switches: 44px tap targets
- [ ] **5.2** `components/student/ProjectSubmissionPortal.tsx`
  - [ ] URL inputs: `inputMode="url"`
  - [ ] Form: single column on mobile

---

## PHASE 6 — CC Role Pages

- [ ] **6.1** CC dashboard + events pages — responsive audit
- [ ] **6.2** `components/cc/CCHackathonManager.tsx`
  - [ ] Scoreboard: mobile card view
  - [ ] Judge panels: single column on mobile
- [ ] **6.3** `components/cc/EditEventForm.tsx` — form responsive
- [ ] **6.4** `components/cc/FeedbackFormBuilder.tsx`
  - [ ] Question type selector: full-width on mobile
  - [ ] Drag handles: larger on mobile
- [ ] **6.5** Discussion/Feedback/Registration toggles — wrap check
- [ ] **6.6** `components/cc/EventPhotosGallery.tsx` — photo grid responsive

---

## PHASE 7 — Admin Role Pages

- [ ] **7.1** Admin dashboard — stats `grid-cols-2 md:grid-cols-4`
- [ ] **7.2** `components/admin/UserTable.tsx` ⚠️ CRITICAL
  - [ ] Add mobile card view (hidden on `md+`)
  - [ ] Keep desktop table (hidden on `< md`)
  - [ ] Actions: stack vertically on mobile
- [ ] **7.3** `components/admin/LogsPageClient.tsx` ⚠️ CRITICAL
  - [ ] Heading: `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
  - [ ] FilterBar: `p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem]`
  - [ ] Group headers: `p-4 sm:p-6 md:p-8`
  - [ ] Export+drain buttons: `flex-wrap`
  - [ ] Timeline item layout: stack on mobile
- [ ] **7.4** `components/admin/AdminEventList.tsx` — responsive
- [ ] **7.5** `components/admin/AttendanceManager.tsx` — table→cards
- [ ] **7.6** `components/admin/EventRegistrationStats.tsx` — stats grid
- [ ] **7.7** `components/admin/SelectiveBackupCard.tsx` — responsive
- [ ] **7.8** Admin scanner — camera UI mobile-optimized
- [ ] **7.9** `components/admin/CreateUserModal.tsx` — modal form
- [ ] **7.10** `components/admin/BroadcastButton.tsx` — panel layout
- [ ] **7.11** `components/admin/CombinedSheetButton.tsx` — options panel
- [ ] **7.12** `components/admin/AuditManagement.tsx` — list layout

---

## PHASE 8 — PR / Manager / HOD Pages

- [ ] **8.1** PR layout + dashboard — responsive audit
- [ ] **8.2** `components/pr/PRScannerWithGate.tsx` — mobile scanner UI
- [ ] **8.3** `components/pr/PRReviewForm.tsx` — form responsive
- [ ] **8.4** Manager dashboard + events — audit
- [ ] **8.5** `components/manager/QRScanner.tsx` — mobile scanner
- [ ] **8.6** HOD dashboard + approvals — card layout

---

## PHASE 9 — Shared Components

- [ ] **9.1** `components/shared/EveBot.tsx`
  - [ ] Mobile: full-width bottom sheet `fixed bottom-0 left-0 right-0 h-[70vh] rounded-t-2xl`
  - [ ] Desktop: `fixed bottom-4 right-4 w-[380px]`
  - [ ] Add safe-area-inset-bottom padding
- [ ] **9.2** `components/messages/MessagesPanel.tsx`
  - [ ] Mobile: `fixed inset-0` full-screen
  - [ ] Desktop: `fixed right-0 top-[60px] w-[380px]`
- [ ] **9.3** `components/BugReporterWidget.tsx` — bottom-sheet on mobile
- [ ] **9.4** `components/shared/EventCalendar.tsx` — responsive cells
- [ ] **9.5** `components/shared/EventBackgroundCustomizer.tsx` — single column mobile
- [ ] **9.6** `components/shared/PosterDesigner.tsx` — mobile warning banner
- [ ] **9.7** `components/shared/VenueSelector.tsx` — dropdown overflow fix
- [ ] **9.8** `components/shared/PatternPicker.tsx` — dropdown overflow fix
- [ ] **9.9** `components/student/ShareEventButton.tsx`
  - [ ] Implement Web Share API for mobile
  - [ ] Modal: `max-w-sm mx-4`
- [ ] **9.10** `components/student/QRDisplay.tsx` — `max-h-[90vh] overflow-y-auto`
- [ ] **9.11** `components/student/ProfileUpdateSlider.tsx` — `w-[min(100vw,420px)]`
- [ ] **9.12** `components/shared/SkeletonLoader.tsx` — `w-full` widths
- [ ] **9.13** `components/ui/ImageUploadInput.tsx` — touch-friendly upload area

---

## PHASE 10 — Touch UX + Special Fixes

- [ ] **10.1** All fixed heights → fluid on mobile
  - [ ] EventThread: `h-[400px] sm:h-[500px] md:h-[560px]`
  - [ ] LogsPageClient containers: responsive max-height
- [ ] **10.2** Hover-only → touch fallbacks across all components
- [ ] **10.3** Horizontal scrollers: add scroll-snap + `-webkit-overflow-scrolling: touch`
- [ ] **10.4** All hero headings: responsive font size scaling
- [ ] **10.5** iOS zoom fix: `font-size: 16px` on all inputs (via globals.css)
- [ ] **10.6** All buttons: minimum `min-h-[44px]` or `h-11`
- [ ] **10.7** Consider adding `BottomNav.tsx` for student mobile navigation

---

## PHASE 11 — Static Pages

- [ ] **11.1** `app/not-found.tsx` — responsive layout
- [ ] **11.2** `app/status/page.tsx` — status cards grid

---

## PHASE 12 — Verification & Testing

- [ ] Test at 320px (iPhone SE)
- [ ] Test at 375px (iPhone 8)
- [ ] Test at 390px (iPhone 14)
- [ ] Test at 414px (iPhone 11 Max)
- [ ] Test at 768px (iPad portrait)
- [ ] Test at 1024px (iPad landscape / small laptop)
- [ ] Test dark mode at each breakpoint
- [ ] Test with virtual keyboard open on mobile
- [ ] Test landscape orientation
- [ ] Run `npm run build` — no errors
- [ ] Run `npm run build` — push to Git

---

## Progress Tracking

**Total Tasks**: ~120 items across 12 phases  
**Phases Done**: 0/12  
**Files Modified**: 0/68+

---

*Last Updated: After full codebase audit on 2026-06-18*

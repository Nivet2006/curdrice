# Club-Eve Development Roadmap
> Future features, enhancements, and the long-term vision for a campus-wide event management ecosystem.

---

## Academic & Operational Excellence
*Focus on college-wide scalability and administrative efficiency.*

*   **Central College Dashboard**: A unified feed showing all clubs, all events, and campus-wide highlights.
*   **Venue & Hall Booking System**: Integrated management to prevent multiple events at the same venue and time.
*   [x] **Event Calendar View**: Interactive monthly/weekly calendar to help organizers avoid scheduling clashes.
*   **Department Analytics**: Visual reports for faculty showing participation trends across different departments.
*   [x] **Audit Logs**: Comprehensive tracking of all admin and manager actions for security and accountability.
*   **Bulk User Import (CSV)**: Ability to upload entire student batches directly into the system for instant onboarding.
*   **Self-Service QR Check-in Terminal**: Dedicated full-screen kiosk interface for scanning student badges at event entrances.
*   **Automated Budget & Expense Tracker**: Free ledger tool for coordinators to upload receipts and log event costs.
*   **AI-Powered Turnout Prediction**: Analyzing historic registration and check-in ratios to predict actual event attendance.

---

## Student Growth & Career Impact
*Features designed to provide tangible value to the student's academic profile.*

*   **Participation History**: A detailed personal record in the student profile showing every event attended.
*   [x] **Automated Certificate Generation (PDF)**: Instant, branded participation certificates generated as soon as attendance is marked.
*   **Resume / Co-curricular Export**: One-click download of a "Participation Record" that can be attached to resumes or submitted for academic credits.
*   **Custom Student Portfolio Builder**: Automatic collection of a student's co-curricular achievements into a shareable web page.
*   **LinkedIn Credential Integration**: Direct publishing of earned event certificates to student LinkedIn profiles with verified credentials.
*   **Points & Credits System**: Awarding "Event Credits" based on attendance, which can be used for internal college incentives.

---

## Communication & Global Reach
*Boosting awareness and engagement across the campus.*

*   **Global Announcements**: Admin-to-student broadcast system for urgent campus-wide updates.
*   **In-App Group Messaging Broadcasts**: Send targeted group announcements straight to event discussion channels.
*   **Dynamic Poster Gallery**: Dedicated section for event posters with generated "Share Links" for WhatsApp/Instagram.
*   **Event Highlights Gallery**: Post-event storage for photos and videos to showcase successes and build future interest.
*   **Event Reminder Notifications**: automated email and push alerts 24 hours before a student's registered event.

---

## Smart System Intelligence
*Advanced logic to handle complex scheduling and eligibility rules.*

*   **Automated Clash Detection**: Real-time warnings if two major events overlap or if a student registers for two events at the same time.
*   [x] **Enhanced Eligibility Auto-Check**: Expanded rules including CGPA requirements, prerequisite event attendance, or specific student group access.
*   [x] **Waitlist + Auto-Fill**: Automated queue management when capacity is reached; users are bumped into active slots when cancellations occur.
*   **Intelligent Proposal Auto-Formatting**: AI assistance to automatically format proposal details to fit college guidelines.
*   **NFC/RFID Attendance Check-in**: Hardware-based tap check-in integration for high-speed offline attendance logging.
*   **Live Event Mode**: Real-time dashboard showing live check-in counts and attendee statistics during an event.

---

## Engagement & Gamification
*Encouraging a vibrant and active student community.*

*   **Campus Leaderboards**: Showcasing the most active students and the most successful clubs on the homepage.
*   [x] **Feedback & Rating System**: 5-star rating and comment system for students to review events and help managers improve.
*   **Custom Event Quizzes & Polls**: Free interactive trivia or Q&A widgets for coordinators to run live during completed events.
*   **Multi-College Mode**: Future-proof architecture to support multiple campuses or external university collaborations.

---

## Requested by GCEM (Special Administrative Features)
*Custom operational flows designed for institutional academic requirements.*

*   **Faculty Event Proposals**: Allow faculty members to directly create guest lectures, alumni talks, and industrial visits.
*   **Bypassed Approval Pipeline**: Faculty-created events bypass CC and PR review stages, routing directly to HOD for instant approval, going straight to students for registration.
*   **Compulsory Closed/Selective Events**: Override options to forcefully auto-register targeted students (generating direct QR codes without registration required).
*   **Allow Open Registrations alongside Compulsory Attendance**: A checkbox option that ensures targeted students are forcefully pre-registered and must attend, while concurrently allowing other students to manually register for any remaining event slots.
*   **Faculty-Led Auditing**: Post-event validation and report checking bypasses PR and goes directly from the assigned Faculty to HOD review.

---

## Top 3 Priority Features (High Impact)
1.  **Certificate Generation (PDF)**: Immediate reward for students, highly impressive practically.
2.  **Hall Booking + Clash Detection**: Solves the most common operational headache for college faculty.
3.  **Resume / Participation Export**: Directly links club activities to student career outcomes.

## Completed Milestones

### 2026-06 (Smart Queue & Waitlists)
- [x] **Waitlist + Auto-Fill**: Automated waitlist slots with queue management set during and post event creation.
- [x] **Postgres Trigger Promotion**: Automated first-in-first-out promotion of the oldest waitlisted student when cancellations or capacity increases occur.
- [x] **Automatic Chat & Notifications**: Promoted students automatically get added to discussion threads and receive instant notification alerts.
- [x] **Waitlisted Cards & UI Badge**: Clean orange badge for waitlisted events on student dashboards, cards, and list views.
- [x] **Database Migration 0020**: `events.waitlist_max`, `registrations.is_waitlisted` column additions, triggers.

### 2026-05 (Event Discussion Threads)
- [x] **Discord-like Event Chat**: Per-event group discussion threads with @mention autocomplete, reply threading, and emoji reactions.
- [x] **CC Discussion Toggle**: Club Coordinators can enable/disable discussion threads per event with LIVE/OFFLINE status indicator.
- [x] **Auto-join on Registration**: Students are automatically added to the event thread when they register for an event with discussions enabled.
- [x] **Realtime Subscriptions**: Supabase `postgres_changes` for instant message delivery and reaction updates.
- [x] **@Mention Notifications**: `thread_mention` notification type created when users are mentioned in event threads.
- [x] **Database Migration 0011**: `events.discussion_enabled`, `conversations.event_id`, `messages.reply_to_id`, `message_reactions` table.

### 2026-05 (Student Management System)
- [x] **Teacher Student Management Panel**: Bulk promote, individual editing, semester/year filters, backlog/yearback flags.
- [x] **Student Profile Update Request Workflow**: Slider-based UI for students to submit change requests routed to HOD.
- [x] **HOD Profile Approval Queue**: Approve/reject student profile update requests with optional feedback.
- [x] **Database Migration 0010**: `profile_update_requests` table, `has_backlog`/`year_back` profile columns.

### 2026-04 (Security & Authorization)
- [x] **Real-Time Messaging**: Broadcast system and peer-to-peer event sharing.
- [x] **Advanced Auth (TOTP)**: Mandatory 2FA for all faculty and administrative roles.
- [x] **USN-Based Authentication**: Refined login logic prioritizing University Serial Numbers.
- [x] **Teacher/HOD Authorization Pipeline**: Multi-stage approval flow for new event proposals.
- [x] **PR Audit Workflow**: Post-event verification of attendance data and feedback quality.
- [x] **Infrastructure Dashboard**: Real-time server health and security audit logs.
- [x] **Dark Mode Theme System**: Full accessibility-compliant dark theme implementation.
- [x] **Combined Attendance Sheet**: Multi-semester Excel export with summary dashboard.
- [x] **Robust Auth Error Handling**: Stale session purge and graceful cookie clearing in middleware.

### 2026-03 (Core Platform)
- [x] **Event Eligibility Constraints**: Semester, year, department gating with server-side validation.
- [x] **Branded QR Attendance**: Dynamic QR generation with `|||··||` watermark + two-step scan confirmation.
- [x] **Admin User Management**: Role assignment, soft-delete, password-verified destructive actions.
- [x] **System Backup Centre**: Full ZIP export of all database tables.
- [x] **Student Profile & One-Time Edit**: Username setup with permanent lock after first save.
- [x] **ShieldLoader Auth UI**: Full-screen animated security checkpoint overlay.
- [x] **Mobile Responsive Navbar**: Hamburger menu with slide-in sidebar for mobile.
- [x] **Eve Bot AI Assistant**: Localized NLP chatbot with Bayesian classification.

---
*Last updated: 2026-06-09*
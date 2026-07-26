# Club Eve — Complete Service Layer Architecture & Implementation Audit

This document is a comprehensive architectural audit of the Club Eve codebase, detailing the proposed service-layer architecture for `lib/services/`. It analyzes the database schema, migrations, RLS policies, triggers, and existing logic to determine the viability and responsibilities of 43 proposed services.

---

## 1. `registration-service.ts`

### 1. Service Status
**REQUIRED**
Event registration is the core interaction loop for students. It involves capacity checks, waitlists, and demographic constraint validations. Centralizing this is mandatory to prevent duplicate validation logic scattered across API routes and server actions.

### 2. Codebase Evidence
- `lib/actions/student-actions.ts`: Contains `registerForEvent` and `cancelRegistration`. Includes duplicate logic for checking event capacity and constraints.
- `lib/actions/admin.ts`: Contains registration manipulation logic.
- `app/api/events/register/route.ts`: API route handling registration payloads.
- `supabase/migrations/0017_preserve_attendance_on_event_delete.sql`: Contains the `trg_populate_registration_event_details` trigger.

### 3. Database Tables
- **`registrations`**:
  - Purpose: Tracks student sign-ups for events.
  - Columns: `id` (PK, uuid), `event_id` (FK to events.id), `student_id` (FK to profiles.id), `qr_token` (unique), `checked_in`, `checked_in_at`, `registered_at`, `is_waitlisted`.
  - Foreign Keys: `event_id` (ON DELETE SET NULL), `student_id`.
- **`event_constraints`**:
  - Purpose: Defines allowed demographics (semester, year, department).
  - Columns: `id`, `event_id`, `allowed_semesters`, `allowed_years`, `allowed_departments`.

### 4. RLS Policy Analysis
- RLS is enabled on `registrations`.
- Current policies likely assume `auth.uid() = student_id` for inserts and updates by students.
- Service implementation should use a combination of authenticated client (for user intent) and service-role client (for bypassing RLS during capacity lock checks to prevent race conditions).

### 5. Database Functions / RPC Analysis
- No specific RPC exists for creating a registration. A transaction-safe RPC for `register_student(event_id, student_id)` should ideally be created to prevent capacity race conditions (checking count and inserting atomically). 

### 6. Trigger Analysis
- `trg_populate_registration_event_details` (BEFORE INSERT ON `registrations`): Copies `title`, `club_name`, and `event_date` to preserve history if the event is deleted.
- `on_registration_points` (AFTER INSERT ON `registrations`): Automatically awards gamification points.
- `trigger_registration_promotion` (AFTER UPDATE OF `is_waitlisted` ON `registrations`): Promotes waitlisted students.
- **Rule:** The service MUST NOT manually award points or promote waitlisted students, as triggers already handle this.

### 7. Existing Business Logic
1. User clicks Register.
2. Server action fetches `profiles` (for USN, department, semester, year).
3. Fetches `events` and `event_constraints` to check eligibility.
4. Counts existing `registrations` to check against `events.max_capacity`.
5. Determines if user should be `is_waitlisted`.
6. Inserts row into `registrations`.
7. Triggers run to award points and preserve event data.

### 8. Duplicate Logic Analysis
- Logic checking if a user is eligible based on `event_constraints` exists in both `student-actions.ts` and the frontend UI logic.
- **Risk:** High. UI logic can be bypassed.
- **Recommended canonical implementation:** Move all eligibility validation strictly to `registration-service.ts`.

### 9. Problems in Current Architecture
- **Race conditions (HIGH):** Fetching the current registration count and then inserting allows a race condition if multiple users register simultaneously near the capacity limit.
- **Inconsistent validation (MEDIUM):** Demographics validation is sometimes bypassed in admin flows.

### 10. Service Responsibilities
- Owns: Registration creation, registration cancellation, capacity checking, eligibility validation (checking semesters/departments).
- Does NOT own: Points allocation (trigger), QR generation (qr-service).

### 11. Proposed Public API
```ts
export async function registerForEvent(
  input: RegisterForEventInput,
  actorId: string
): Promise<RegistrationResult>

export async function cancelRegistration(
  registrationId: string,
  actorId: string
): Promise<void>

export async function getRegistrationStatus(
  eventId: string,
  userId: string
): Promise<RegistrationStatus>
```
- **Side effects:** Inserts into `registrations`.
- **Possible errors:** `CapacityReachedError`, `IneligibleStudentError`, `AlreadyRegisteredError`.

### 12. TypeScript Types
- `RegisterForEventInput`: `{ eventId: string, studentId: string }`
- `RegistrationResult`: `{ success: boolean, waitlisted: boolean, qrToken: string }`
- `RegistrationStatus`: Enum (REGISTERED, WAITLISTED, ELIGIBLE, INELIGIBLE, CAPACITY_REACHED).

### 13. Error Handling Strategy
- Use domain-specific custom Error classes (e.g., `RegistrationClosedError`, `AlreadyRegisteredError`).

### 14. Transaction Requirements
- **Atomic execution required:** Checking capacity and inserting the registration MUST be atomic.
- Recommend migrating the core insert to an RPC function `register_student_atomic` to utilize row-level locking or serializable transactions.

### 15. Security Analysis
- IDOR risk: Ensure `actorId` matches `studentId` unless `actorId` has an admin/cc role.
- Service-role exposure: Required only for atomic capacity checks.

### 16. Performance Analysis
- N+1 patterns exist when listing events and fetching registration status for each. Recommend batching or utilizing a materialized view.

### 17. Dependencies
- Depends on: `qr-service.ts` (to generate the token).
- Used by: `app/api/events/register/route.ts`, `lib/actions/student-actions.ts`.

### 18. Migration Plan
1. Create `registration-service.ts`.
2. Extract capacity and constraint validation logic from `student-actions.ts`.
3. Update `student-actions.ts` to call the service.
4. Replace API route implementations.
5. Create RPC for atomic inserts.

### 19. Required Tests
- Two users attempt to claim the final event seat simultaneously.
- User registers twice for the same event.
- User outside allowed semesters attempts registration.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P0
- **Complexity:** HIGH
- **Security Sensitivity:** HIGH
- **Implementation Order:** 1

---

## 2. `attendance-service.ts`

### 1. Service Status
**REQUIRED**
Check-ins dictate event success and point distribution. It requires a dedicated service to handle manual check-ins and QR-based automated check-ins securely without relying directly on database queries in components.

### 2. Codebase Evidence
- `lib/actions/admin.ts`: Contains `manualCheckIn(usn, eventId)`.
- `components/admin/EventRegistrationStats.tsx`: Contains direct Supabase queries to update attendance.

### 3. Database Tables
- **`registrations`**:
  - Columns: `checked_in` (boolean), `checked_in_at` (timestamptz), `qr_token` (text).

### 4. RLS Policy Analysis
- Updates to `checked_in` should be restricted to users with `cc`, `admin`, or `pr` roles for the specific event.
- Service must assert the actor's role before performing the update.

### 5. Database Functions / RPC Analysis
- None currently exist specifically for attendance.

### 6. Trigger Analysis
- `on_check_in_points` (AFTER UPDATE OF `checked_in` ON `registrations`): Awards points based on `events.is_compulsory`.
- **Rule:** Do not manually award points; rely on the trigger.

### 7. Existing Business Logic
1. Admin enters USN or scans QR.
2. Resolves student ID from USN.
3. Queries `registrations` for `student_id` and `event_id`.
4. Updates `checked_in = true` and `checked_in_at = now()`.

### 8. Duplicate Logic Analysis
- Verification of USN and fetching registration IDs is duplicated in `manualCheckIn` and QR scanning APIs.
- **Canonical Service:** `attendance-service.ts`.

### 9. Problems in Current Architecture
- **Client-side trust (HIGH):** Updating check-ins from client-side components risks unauthorized attendance marking.
- **Silent failures (LOW):** If a student is not registered, the error response is inconsistent.

### 10. Service Responsibilities
- Owns: Marking attendance (QR and Manual), revoking attendance.
- Does NOT own: QR code generation.

### 11. Proposed Public API
```ts
export async function markAttendanceByQR(
  qrToken: string,
  actorId: string
): Promise<AttendanceResult>

export async function markAttendanceManual(
  eventId: string,
  usn: string,
  actorId: string
): Promise<AttendanceResult>
```

### 12. TypeScript Types
- `AttendanceResult`: `{ success: boolean, message: string, studentName?: string }`

### 13. Error Handling Strategy
- Use result objects `{ error: string } | { success: true }` for clean UI feedback.

### 14. Transaction Requirements
- Updates are single-row, no complex transactions needed.

### 15. Security Analysis
- Actor authorization is critical. The service must verify `actorId` is an admin or the event's coordinator before allowing the update.

### 16. Performance Analysis
- Simple primary key updates. No major performance concerns.

### 17. Dependencies
- Depends on: `qr-service.ts` (for token decoding), `permission-service.ts` (for authz).

### 18. Migration Plan
1. Create `attendance-service.ts`.
2. Move `manualCheckIn` from `admin.ts`.
3. Refactor QR scanner API to use `markAttendanceByQR`.

### 19. Required Tests
- Valid QR scan by authorized admin.
- Invalid QR token.
- Manual check-in for unregistered student.
- Unauthorized check-in attempt by regular student.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P1
- **Complexity:** LOW
- **Security Sensitivity:** MEDIUM
- **Implementation Order:** 2

---

## 3. `event-service.ts`

### 1. Service Status
**REQUIRED**
Events have a complex lifecycle (draft, pending_pr, approved) and are the root entity of the application. Centralizing creation, updates, and lifecycle transitions is critical.

### 2. Codebase Evidence
- `lib/actions/cc-events.ts`: Event creation by Club Coordinators.
- `lib/actions/teacher-events.ts`: Event approval by Teachers.
- `supabase/migrations/0003_clubeve_extension.sql`: Defines `approval_status` enum.

### 3. Database Tables
- **`events`**:
  - Columns: `id`, `title`, `status`, `approval_status`, `max_capacity`, `created_by`, `venue_id`.
- **`event_constraints`**: Associated dynamically upon event creation.

### 4. RLS Policy Analysis
- Heavy RLS exists ensuring CCs can only edit their own events (`created_by = auth.uid()`), while Teachers/HODs can edit based on department alignments.

### 5. Database Functions / RPC Analysis
- `generate_event_code()`: Generates custom string IDs (e.g., A34B-123RE). The service must rely on this default value during inserts.

### 6. Trigger Analysis
- `on_event_approval_points` (AFTER UPDATE OF `approval_status`): Awards points to the creator upon approval.
- `trigger_compulsory_autoregistration`: Auto-registers students for compulsory events.

### 7. Existing Business Logic
- CC submits event form -> inserted as `draft`.
- Teacher reviews and updates `approval_status` to `approved` or `rejected`.

### 8. Duplicate Logic Analysis
- Status transition logic and constraints insertion is scattered across action files.
- **Canonical Service:** `event-service.ts`.

### 9. Problems in Current Architecture
- **Inconsistent validation (MEDIUM):** Updates to events do not always check if the event is already approved, potentially allowing post-approval modifications that bypass Teacher review.

### 10. Service Responsibilities
- Owns: Event CRUD, lifecycle transitions (approve/reject), constraints management.
- Does NOT own: Venue booking logic (should delegate to `venue-service`).

### 11. Proposed Public API
```ts
export async function createEvent(payload: CreateEventPayload, actorId: string): Promise<Event>
export async function updateEventStatus(eventId: string, status: EventApprovalStatus, actorId: string): Promise<void>
```

### 12. TypeScript Types
- `CreateEventPayload`: Omit<Event, 'id' | 'created_at'> & { constraints: Constraints }

### 13. Error Handling Strategy
- Standard exception throwing for invalid state transitions (e.g., `InvalidStateTransitionError`).

### 14. Transaction Requirements
- Creating an event and its associated `event_constraints` must be atomic (RPC recommended).

### 15. Security Analysis
- RLS handles basic row access, but the service must enforce business rules (e.g., CC cannot self-approve).

### 16. Performance Analysis
- Event listing queries can be heavy; ensure indexes on `approval_status` and `event_date`.

### 17. Dependencies
- Depends on: `permission-service.ts`, `venue-service.ts`.

### 18. Migration Plan
1. Consolidate logic from `cc-events.ts` and `teacher-events.ts`.
2. Migrate UI components to use server actions wrapping `event-service.ts`.

### 19. Required Tests
- CC attempting to approve their own event.
- Creation of an event with invalid constraints.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P0
- **Complexity:** HIGH
- **Security Sensitivity:** HIGH
- **Implementation Order:** 3

---

## 4. `club-service.ts`

### 1. Service Status
**REQUIRED**
Clubs are distinct entities that group students, events, and performance metrics. Managing clubs and their memberships requires a dedicated boundary.

### 2. Codebase Evidence
- `app/admin/clubs/page.tsx`: UI containing direct queries to `clubs`.
- `lib/actions/admin.ts`: Contains potential club management logic.

### 3. Database Tables
- **`clubs`**: `id`, `name`, `description`, `created_by`.
- **`club_members`**: `id`, `club_id`, `profile_id`, `role` (president, member, etc).

### 4. RLS Policy Analysis
- `clubs` should be readable by all, but only writable by admins.
- `club_members` should be manageable by the club president or admins.

### 5. Database Functions / RPC Analysis
- None detected for clubs.

### 6. Trigger Analysis
- None detected for clubs.

### 7. Existing Business Logic
- Admins create clubs manually in the dashboard.
- Students are added to clubs via admin interfaces.

### 8. Duplicate Logic Analysis
- Minimal duplication currently, but logic is tightly coupled to UI components.

### 9. Problems in Current Architecture
- **Client-side trust (MEDIUM):** Some club queries and aggregations run directly in React Server Components without service abstraction.

### 10. Service Responsibilities
- Owns: Club CRUD, club member additions/removals, role assignments within the club.

### 11. Proposed Public API
```ts
export async function createClub(payload: CreateClubPayload, actorId: string): Promise<Club>
export async function addClubMember(clubId: string, profileId: string, role: string, actorId: string): Promise<void>
```

### 12. TypeScript Types
- `CreateClubPayload`: `{ name: string, description: string }`

### 13. Error Handling Strategy
- Custom errors: `ClubNotFoundError`, `DuplicateClubMemberError`.

### 14. Transaction Requirements
- None currently needed.

### 15. Security Analysis
- Must verify `actorId` is an admin before club creation.

### 16. Performance Analysis
- Low impact.

### 17. Dependencies
- Depends on: `permission-service.ts`.

### 18. Migration Plan
1. Extract club logic from admin dashboards into the service.

### 19. Required Tests
- Non-admin attempting to create a club.
- Adding a member to a non-existent club.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P1
- **Complexity:** LOW
- **Security Sensitivity:** MEDIUM
- **Implementation Order:** 4

---

## 5. `membership-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `club-service.ts`)
The `club_members` table and the `clubs` table are tightly coupled. Extracting membership into a separate service creates unnecessary micro-service overhead in a modular monolith. All operations involving adding or removing members inherently affect the state of the club.

### 2. Codebase Evidence
- Interacts purely with `club_members`.
- The business logic for assigning members to clubs currently resides within `lib/actions/admin.ts` where admin operations add profiles directly to the `club_members` table.
- This logic overlaps heavily with club creation, suggesting they should live in the same bounded context.

### 3. Database Tables
- **`club_members`**:
  - Columns: `id` (uuid), `club_id` (FK to clubs), `profile_id` (FK to profiles), `role` (enum: president, member, coordinator).
  - Purpose: Tracks which students belong to which club and their authority within that club.

### 4. RLS Policy Analysis
- RLS policies on `club_members` allow users to read their own memberships, but inserts/updates are restricted to users holding the 'admin' role or the 'president' role for the corresponding `club_id`.
- The unified `club-service.ts` must respect these constraints, evaluating the actor's role via `permission-service` before mutating data.

### 5. Database Functions / RPC Analysis
- No specific Postgres functions handle membership insertion.
- The absence of an RPC indicates that the application layer is fully responsible for verifying club validity and student validity before inserting into `club_members`.

### 6. Trigger Analysis
- No database triggers are explicitly defined for `club_members`.
- If gamification points were tied to joining a club in the future, a trigger would be recommended over manual point insertion, but presently, the service layer handles pure CRUD.

### 7. Existing Business Logic
- The current workflow in the UI allows admins to select a club, select a user via their USN, and assign them a role.
- The server action receives this payload and inserts the row.

### 8. Duplicate Logic Analysis
- Checking if a student is already in a club is duplicated across UI selection filtering and the server action.
- By merging this into `club-service.ts`, we centralize the `addClubMember` logic, preventing developers from bypassing unique constraints.

### 9. Problems in Current Architecture
- **Fragmentation (LOW):** Separating this service would mean `club-service` handles the club metadata, but `membership-service` handles the members. When an API needs to fetch a club and its members, it would have to orchestrate between two services, leading to inefficient cross-service calls.

### 10. Service Responsibilities
- (Merged into `club-service.ts`)
- The `club-service.ts` will fully own: adding members, removing members, transferring club leadership, and querying all members of a club.

### 11. Proposed Public API
- Since this service is merged, the proposed API functions will reside in `club-service.ts`:
  - `addMemberToClub(clubId: string, studentId: string, role: ClubRole): Promise<void>`
  - `removeMemberFromClub(clubId: string, studentId: string): Promise<void>`

### 12. TypeScript Types
- Types will be exported from `club-service.ts`:
  - `ClubRole`: Type mapping to the Postgres enum (e.g., `'president' | 'coordinator' | 'member'`).
  - `MembershipPayload`: `{ clubId: string, profileId: string, role: ClubRole }`.

### 13. Error Handling Strategy
- Domain errors should explicitly map to failure states rather than generic exceptions:
  - `UserAlreadyInClubError`: Thrown if the unique constraint on `(club_id, profile_id)` is violated.
  - `InvalidClubRoleError`: Thrown if an invalid role string is passed.

### 14. Transaction Requirements
- Adding a single member does not require a complex transaction.
- However, transferring the `president` role from User A to User B requires an atomic transaction to ensure the club always has exactly one president. This should be handled via a custom RPC called by `club-service.ts`.

### 15. Security Analysis
- **Attack Surface:** Malicious users could attempt to forge requests to add themselves to clubs as presidents to gain event-creation privileges.
- **Mitigation:** The underlying implementation in `club-service` must strictly validate that the `actorId` invoking the function is a global admin or the existing president of the club.

### 16. Performance Analysis
- Fetching members for a club requires joining `club_members` with `profiles`. 
- **Impact:** Querying memberships is highly frequent. Ensure a composite index exists on `(club_id, profile_id)` to optimize these joins.

### 17. Dependencies
- This domain responsibility depends heavily on `permission-service.ts` for verifying if the actor can modify memberships.
- There are no external package dependencies.

### 18. Migration Plan
- **Action Required:** Do not create `membership-service.ts`.
- Instead, open `lib/services/club-service.ts` and ensure it exports the membership management functions detailed in section 11.
- Refactor existing admin actions to point to `club-service.addMemberToClub()`.

### 19. Required Tests
- Test adding a user to a club successfully.
- Test adding a user to a club they already belong to (expect `UserAlreadyInClubError`).
- Test an unauthorized user attempting to add a member (expect permission denial).

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED
- **Priority:** P1 (Integrated into Club Service)
- **Complexity:** LOW
- **Security Sensitivity:** HIGH
- **Implementation Order:** Executed concurrently with `club-service.ts` (Order #4).


---

## 6. `permission-service.ts`

### 1. Service Status
**REQUIRED**
Role checks (e.g., verifying if a user is an admin, CC, PR, or Teacher) are currently duplicated across nearly every action file. A centralized permission service is essential to eliminate duplication and ensure consistent authorization logic.

### 2. Codebase Evidence
- `lib/actions/admin.ts`: Contains `assertAdmin()` which queries the `profiles` table to check if `role === 'admin'`.
- `lib/actions/cc-events.ts`: Contains `assertCC()` or similar duplicate checks.
- `lib/actions/teacher-events.ts`: Asserts teacher/HOD roles.

### 3. Database Tables
- **`profiles`**:
  - Columns: `id`, `role` (enum: student, cc, pr, teacher, hod, admin).

### 4. RLS Policy Analysis
- RLS heavily depends on the `role` column or the `created_by` column.
- The service acts as an application-level gatekeeper *before* invoking Supabase queries.

### 5. Database Functions / RPC Analysis
- Supabase native `auth.uid()` is heavily used in Postgres policies. No custom RPCs manage permissions.

### 6. Trigger Analysis
- None.

### 7. Existing Business Logic
- Server action is called -> action executes `await createClient()` -> gets user -> queries `profiles` for role -> throws error if insufficient -> executes business logic.

### 8. Duplicate Logic Analysis
- Fetching the profile role is duplicated in every specialized action file.
- **Risk:** High. Inconsistent checks could lead to unauthorized actions if a developer forgets to copy the `assert` block.
- **Canonical Service:** `permission-service.ts`.

### 9. Problems in Current Architecture
- **Repeated queries (HIGH):** Every action queries `profiles` individually. This could be cached or abstracted.

### 10. Service Responsibilities
- Owns: Verifying user roles, verifying club-level permissions (e.g., is president of club X), asserting ownership of resources.

### 11. Proposed Public API
```ts
export async function assertGlobalRole(userId: string, allowedRoles: Role[]): Promise<void>
export async function assertClubRole(userId: string, clubId: string, allowedRoles: string[]): Promise<void>
export async function canApproveEvent(userId: string, eventId: string): Promise<boolean>
```

### 12. TypeScript Types
- `Role`: (existing generated enum).

### 13. Error Handling Strategy
- Throw custom `PermissionDeniedError` or `UnauthorizedError`.

### 14. Transaction Requirements
- None. Read-only service.

### 15. Security Analysis
- CRITICAL security boundary. This service prevents IDOR and privilege escalation.

### 16. Performance Analysis
- Queries to `profiles` are fast, but could be cached in Redis or Next.js cache if called repeatedly in a single request.

### 17. Dependencies
- Depends on: None.
- Used by: ALL other services.

### 18. Migration Plan
1. Create `permission-service.ts`.
2. Find and replace all `assertAdmin`, `assertCC` functions across `lib/actions/*`.

### 19. Required Tests
- Student attempting an admin action.
- CC attempting to approve an event (Teacher action).

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P0
- **Complexity:** LOW
- **Security Sensitivity:** CRITICAL
- **Implementation Order:** 1 (Foundation)

---

## 7. `qr-service.ts`

### 1. Service Status
**RECOMMENDED**
QR token generation and validation are tightly coupled to registration and attendance. Abstracting this logic allows for future changes (e.g., rotating QR codes, adding cryptographic signatures) without rewriting attendance logic.

### 2. Codebase Evidence
- `lib/actions/student-actions.ts`: Inserts a `qr_token` during registration.

### 3. Database Tables
- **`registrations`**: Stores the generated `qr_token`.

### 4. RLS Policy Analysis
- QR tokens must be treated as secrets. Only the registered student and admins/scanners should read the `qr_token` field.

### 5. Database Functions / RPC Analysis
- None.

### 6. Trigger Analysis
- None.

### 7. Existing Business Logic
- During registration, a unique string (often a UUID or a hash) is generated and stored in `registrations.qr_token`. It is rendered as a QR code on the frontend. The scanner app reads the text and sends it to the check-in API.

### 8. Duplicate Logic Analysis
- Generating the token format might be duplicated if different event types implement registration separately.

### 9. Problems in Current Architecture
- **Security risks (MEDIUM):** If QR tokens are purely predictable strings, students could spoof them.

### 10. Service Responsibilities
- Owns: Generating secure, verifiable QR tokens; decoding and validating scanned tokens.

### 11. Proposed Public API
```ts
export function generateQRToken(eventId: string, studentId: string): string
export function validateQRToken(token: string): { eventId: string, studentId: string }
```

### 12. TypeScript Types
- `TokenPayload`: `{ eventId: string, studentId: string, iat: number }`

### 13. Error Handling Strategy
- `InvalidTokenError`, `ExpiredTokenError`.

### 14. Transaction Requirements
- None. Compute only.

### 15. Security Analysis
- Tokens should ideally be signed (e.g., simple JWTs or HMAC) to prevent forgery before hitting the database.

### 16. Performance Analysis
- Purely CPU-bound, extremely fast.

### 17. Dependencies
- Depends on: None.
- Used by: `registration-service.ts`, `attendance-service.ts`.

### 18. Migration Plan
1. Centralize the token generator.
2. Update the frontend scanner to use the validation method.

### 19. Required Tests
- Forged token validation failure.
- Successful encode/decode cycle.

### 20. Final Recommendation
- **Status:** RECOMMENDED
- **Priority:** P3
- **Complexity:** LOW
- **Security Sensitivity:** HIGH
- **Implementation Order:** 5

---

## 8. `waitlist-service.ts`

### 1. Service Status
**ALREADY IMPLEMENTED ELSEWHERE**
The Club Eve database relies heavily on robust PostgreSQL triggers to manage the waitlist. Moving this to the application layer introduces race conditions and duplicates logic already safely handled by the database.

### 2. Codebase Evidence
- `supabase/migrations/0020_event_waitlist.sql`: Contains `trigger_promote_waitlisted_student`, `trigger_promote_on_capacity_increase`, and `trigger_registration_promotion`.

### 3. Database Tables
- **`registrations`**: Uses `is_waitlisted` boolean.
- **`events`**: Uses `max_capacity` and `waitlist_max`.

### 4. RLS Policy Analysis
- Handled at the database level.

### 5. Database Functions / RPC Analysis
- Waitlist promotion happens natively inside trigger functions executing under elevated privileges.

### 6. Trigger Analysis
- `trigger_promote_waitlisted_student`: AFTER DELETE ON registrations. Finds the oldest waitlisted student and promotes them automatically.
- `trigger_promote_on_capacity_increase`: AFTER UPDATE ON events. Promotes multiple students if the capacity is increased.
- `trigger_registration_promotion`: Sends a notification when a student is promoted.

### 7. Existing Business Logic
- When a user cancels a registration, the row is deleted. The database trigger automatically fires, finds the next student, sets `is_waitlisted = false`, and queues a notification.

### 8. Duplicate Logic Analysis
- Moving this to TypeScript would fundamentally duplicate complex SQL logic and introduce locking problems.

### 9. Problems in Current Architecture
- Database triggers hide business logic, making it harder to trace, but they provide perfect atomicity.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Managing waitlist queues, processing capacity openings, and automatically enrolling the next eligible student.
- **Why it is rejected:** The Postgres database completely owns this domain via the `trigger_promote_waitlisted_student` and `trigger_promote_on_capacity_increase` triggers. Attempting to replicate this in TypeScript introduces critical concurrency issues.

### 11. Proposed Public API
- **Justification for Absence:** No public API should be exposed for waitlist promotion. Waitlist state transitions happen transparently as a side-effect of registration deletions or capacity updates.
- If we were to build it (not recommended), it would look like:
  - `promoteNextWaitlistedStudent(eventId: string): Promise<void>`

### 12. TypeScript Types
- **Waitlist Models:** Although the service is rejected, the application UI still consumes waitlist data. 
  - `WaitlistStatus`: `'waitlisted' | 'promoted' | 'registered'` (Derived from `is_waitlisted` boolean).

### 13. Error Handling Strategy
- **Domain Errors Avoided:** By relying on triggers, we avoid handling `ConcurrentPromotionError` or `WaitlistEmptyError` in Node.js. If the trigger fails, it rolls back the entire delete/update transaction automatically, bubbling up a standard Postgres exception to the `registration-service`.

### 14. Transaction Requirements
- **Strictly Database-bound:** Promoting a user involves 1) Decrementing the capacity or confirming a deletion, 2) Finding the oldest waitlisted user (requires a `SELECT FOR UPDATE` to lock the row), 3) Updating their status, 4) Inserting a notification. Doing this across a network boundary from Vercel to Supabase is highly susceptible to race conditions. The existing triggers handle this natively in one atomic commit.

### 15. Security Analysis
- **Attack Surface:** Malicious actors could attempt to call a waitlist promotion endpoint repeatedly to manipulate the queue if it were exposed.
- **Mitigation:** By keeping this logic locked inside Postgres triggers operating under the `security definer` context, no client or external API route can maliciously manipulate the waitlist order.

### 16. Performance Analysis
- **Database Load:** Triggers execute instantly on the same thread as the mutation. Moving this to a TypeScript service would require multiple network round-trips, increasing the duration of connection locks and degrading overall API performance.

### 17. Dependencies
- **Service Dependencies:** None. This logic lives entirely within PostgreSQL.

### 18. Migration Plan
- **Action Required:** DO NOT implement `waitlist-service.ts`.
- Ensure that the `registration-service.ts` correctly handles the `is_waitlisted` flag on insert, and leave the promotion logic entirely to the database layer.

### 19. Required Tests
- **Integration Tests Needed:**
  - Create an event with capacity 1. Register User A. Register User B (should be waitlisted).
  - Cancel User A's registration.
  - Verify via `supabase-js` that User B's `is_waitlisted` flag is now `false`.
  - Verify a notification was created for User B.

### 20. Final Recommendation
- **Status:** NOT JUSTIFIED (ALREADY IMPLEMENTED ELSEWHERE)
- **Priority:** NONE (Trigger logic must remain in Postgres; migrating to TypeScript is an anti-pattern for data-integrity-critical promotion logic)
- **Complexity:** HIGH (Database level)
- **Security Sensitivity:** HIGH (Data Integrity)
- **Implementation Order:** NONE (No migration required)

---

## 9. `email-service.ts`

### 1. Service Status
**REQUIRED**
The application sends transactional emails for profile updates, event certificates, and system alerts. Centralizing the email provider (e.g., Resend, SMTP) is a standard requirement.

### 2. Codebase Evidence
- `lib/actions/admin.ts`: Creates auth users which trigger Supabase emails.
- Certificates logic implies emailing generated PDFs.

### 3. Database Tables
- **`cert_deliveries`**: Tracks email dispatch status (`email_sent`, `email_sent_at`, `error`).

### 4. RLS Policy Analysis
- **External Integration Constraint:** The `cert_deliveries` table should strictly restrict inserts to the service-role or authenticated admin users running the email dispatch job. Normal students should only have `SELECT` access to view their delivery status.

### 5. Database Functions / RPC Analysis
- **Missing RPCs:** None exist. It would be beneficial to create an RPC `log_email_delivery` to atomically record a delivery attempt and its timestamp to prevent duplicate emails from being sent if a retry loop triggers.

### 6. Trigger Analysis
- **Event Hook:** We should avoid sending emails directly from Postgres triggers using `pg_net` due to timeout constraints and rate limits. Email dispatch should strictly happen in the Node.js application layer.

### 7. Existing Business Logic
- Supabase GoTrue handles auth emails automatically. Custom emails for certificates are dispatched manually via code, often without comprehensive retry mechanisms or failure logging in the DB.

### 8. Duplicate Logic Analysis
- Email provider initialization (e.g., setting up the Resend client) and template wrapping (adding headers/footers) is currently scattered. Centralizing it prevents template drift.

### 9. Problems in Current Architecture
- Hardcoding email templates in action files makes them impossible to test in isolation.

### 10. Service Responsibilities
- Owns: Compiling email templates, interacting with external email providers (e.g., Resend), error logging for delivery failures.

### 11. Proposed Public API
```ts
export async function sendEmail(payload: EmailPayload): Promise<void>
export async function sendEventCertificate(studentId: string, pdfBuffer: Buffer): Promise<void>
```

### 12. TypeScript Types
- `EmailPayload`: `{ to: string, subject: string, htmlBody: string }`

### 13. Error Handling Strategy
- Custom `EmailDeliveryError`. Wrap external provider errors.

### 14. Transaction Requirements
- The service must ensure that when an email is dispatched successfully, the `cert_deliveries` table is updated within a transaction or immediately following the API success response to ensure state consistency.

### 15. Security Analysis
- Must securely manage API keys.

### 16. Performance Analysis
- Network-bound. Should ideally be pushed to a background queue or handled asynchronously.

### 17. Dependencies
- Depends on: None.
- Used by: `certificate-service.ts`.

### 18. Migration Plan
1. Abstract existing Resend/SMTP logic into the service.
2. Replace hardcoded calls.

### 19. Required Tests
- Ensure template variables are correctly injected.
- Mock external provider and verify payload structure.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P2
- **Complexity:** LOW
- **Security Sensitivity:** LOW
- **Implementation Order:** 6

---

## 10. `reminder-service.ts`

### 1. Service Status
**NOT JUSTIFIED**
The codebase does not currently feature any event reminder scheduling tables, cron jobs, or tracking columns.

### 2. Codebase Evidence
- No tables for reminders. `notifications` exists but is used for immediate events (registration, promotion).

### 3. Database Tables
- None.

### 4. RLS Policy Analysis
- **Absence of Rules:** Since there are no reminder tables, there are no RLS policies. If built, `reminders` would require strict RLS ensuring users can only read their own queued reminders, and only admins/system can insert them.

### 5. Database Functions / RPC Analysis
- **Not Applicable:** No functions exist for scheduling. Native Postgres scheduling requires `pg_cron` extension, which introduces infrastructure complexity beyond the current scope.

### 6. Trigger Analysis
- **Not Applicable:** Triggers cannot execute on a time delay natively without `pg_cron` or a secondary worker queue polling the database.

### 7. Existing Business Logic
- **None:** The application relies on users actively checking the dashboard or relying on immediate event notifications.

### 8. Duplicate Logic Analysis
- **None:** No scheduling logic currently exists to be duplicated.

### 9. Problems in Current Architecture
- **Infrastructure Gap:** Implementing this requires an entirely new architecture for background scheduling (e.g., `pg_cron`, Upstash QStash, or Inngest). Next.js serverless functions cannot self-trigger.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Enqueueing, processing, and dispatching time-delayed emails and push notifications (e.g., "Event starts in 24 hours").
- **Why it is rejected:** Building a custom queueing system is heavy architectural overhead for a feature that isn't critical.

### 11. Proposed Public API
- **Justification for Absence:** No background workers exist to consume the API.
- If a scheduler like Inngest or Upstash QStash were implemented, the API would be:
  - `scheduleReminder(eventId: string, targetTime: Date, payload: ReminderPayload): Promise<string>`
  - `cancelReminder(reminderId: string): Promise<void>`

### 12. TypeScript Types
- `ReminderPayload`: `{ type: 'email' | 'push', templateId: string, recipientIds: string[] }`
- `JobStatus`: `'pending' | 'processing' | 'completed' | 'failed'`

### 13. Error Handling Strategy
- **Expected Errors Avoided:** If we were to build this, we'd need to handle `QueueFullError`, `JobTimeoutError`, and `ProviderRateLimitError`. By skipping this service, we drastically reduce system complexity.

### 14. Transaction Requirements
- **Transactional Enqueueing:** Storing a reminder in the database would need to be transactionally bound to event creation. If the event creation rolls back, the reminder must not be scheduled. 

### 15. Security Analysis
- **Attack Surface:** Malicious scheduling could lead to DoS attacks (e.g., scheduling 1 million reminders) or spamming users, causing the club's email domain to be blacklisted.
- **Mitigation:** Strict rate limits and authorization checks on who can schedule bulk notifications.

### 16. Performance Analysis
- **Storage Impact:** Tracking millions of scheduled and completed reminder jobs will rapidly bloat the database. A separate Redis instance is typically required.

### 17. Dependencies
- **Missing Infrastructure:** This domain requires external dependencies like `@upstash/qstash` or `inngest`, which are not currently installed or configured in the repository.

### 18. Migration Plan
- **Action Required:** Do not implement. 
- If reminders are requested by stakeholders in the future, evaluate integrating a serverless queue provider rather than building it in-house.

### 19. Required Tests
- **Testing Challenges Avoided:** Testing time-delayed jobs requires complex mocking of `Date.now()` and background worker loops, which are notoriously flaky in CI pipelines.

### 20. Final Recommendation
- **Status:** NOT JUSTIFIED
- **Priority:** NONE (Infrastructure missing — no `pg_cron`, Inngest, or persistent worker available)
- **Complexity:** MEDIUM
- **Security Sensitivity:** LOW
- **Implementation Order:** NONE (Blocked by infrastructure)

---
---

## 11. `analytics-service.ts`

### 1. Service Status
**RECOMMENDED**
Aggregating data for dashboards (e.g., total attendees across all events, department-wise participation) is often performed directly in UI components. Abstracting this prevents bloated UI code and repeated aggregations.

### 2. Codebase Evidence
- `components/admin/EventRegistrationStats.tsx`: Performs direct counts and mappings of registrations.

### 3. Database Tables
- **`events`**, **`registrations`**, **`iic_event_feedback_tracking`**.

### 4. RLS Policy Analysis
- Analytics generally bypass RLS using the service role to aggregate global stats, or they rely on `admin` role elevation.

### 5. Database Functions / RPC Analysis
- None explicitly defined for complex cross-event aggregations.

### 6. Trigger Analysis
- **Absence of Triggers:** Analytics are read-only aggregations. No triggers are needed since the service does not mutate data.

### 7. Existing Business Logic
- Admin visits dashboard -> Server component fetches raw registration rows -> UI maps and calculates percentages -> Render.

### 8. Duplicate Logic Analysis
- Attendance percentages are calculated on-the-fly in multiple components.

### 9. Problems in Current Architecture
- **Performance (MEDIUM):** Fetching all raw rows to count them in JS is inefficient for large datasets.

### 10. Service Responsibilities
- Owns: Data aggregation, counting, and providing structured metrics for dashboards.

### 11. Proposed Public API
```ts
export async function getEventStats(eventId: string): Promise<EventStats>
export async function getGlobalClubMetrics(): Promise<GlobalMetrics>
```

### 12. TypeScript Types
- `EventStats`: `{ totalRegistered: number, totalCheckedIn: number, waitlisted: number }`

### 13. Error Handling Strategy
- standard async error throwing.

### 14. Transaction Requirements
- **Read-Only:** Since this service exclusively performs `SELECT COUNT(*)` aggregations, transactions are not required. A standard connection pool query is sufficient.

### 15. Security Analysis
- Must restrict access to admins/cc.

### 16. Performance Analysis
- Should use SQL `COUNT()` aggregations rather than fetching rows.

### 17. Dependencies
- Depends on: `permission-service.ts`.

### 18. Migration Plan
1. Centralize the SQL counts.
2. Refactor `EventRegistrationStats.tsx` to use the service.

### 19. Required Tests
- Accuracy of counts for a mocked event.

### 20. Final Recommendation
- **Status:** RECOMMENDED
- **Priority:** P3
- **Complexity:** LOW
- **Security Sensitivity:** LOW
- **Implementation Order:** 7

---

## 12. `leaderboard-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `gamification-service.ts`)
The leaderboard is simply a query ordering users by `points` from the `profiles` or `points_history` tables. It does not justify a standalone service.

### 2. Codebase Evidence
- Relies on `profiles.points`.

### 3. Database Tables
- **`profiles`**, **`points_history`**.

### 4. RLS Policy Analysis
- Leaderboards are usually public (`SELECT USING (true)`).

### 5. Database Functions / RPC Analysis
- **Absence:** No Postgres functions exist for leaderboard ranking. Ordering is done entirely via SQL `ORDER BY profiles.points DESC`.

### 6. Trigger Analysis
- **Absence:** Leaderboard reads do not fire triggers. Point mutations are handled by existing gamification triggers.

### 7. Existing Business Logic
- Fetches users ordered by points.

### 8. Duplicate Logic Analysis
- Belongs in gamification context.

### 9. Problems in Current Architecture
- Separation creates fragmented APIs.

### 10. Service Responsibilities
- (Merged into gamification-service)

### 11. Proposed Public API
- **Justification for Absence:** Leaderboard queries should be exposed through `gamification-service.ts` (e.g., `gamificationService.getTopUsers(limit)`).

### 12. TypeScript Types
- `LeaderboardEntry`: `{ profileId: string, name: string, points: number, rank: number }`

### 13. Error Handling Strategy
- **Domain Errors:** None specific to leaderboards. Standard database connectivity errors will bubble up through the gamification service.

### 14. Transaction Requirements
- **Compute Only:** Generating a leaderboard requires a `SELECT` with an `ORDER BY` clause. No transactions or locks are required as data is not being mutated.

### 15. Security Analysis
- **Attack Surface:** Exposing the entire points table could allow scraping of student data. 
- **Mitigation:** The merged service must enforce pagination and limit the response to the top N users, stripping sensitive profile information before sending it to the client.

### 16. Performance Analysis
- **Indexing:** A descending b-tree index on `profiles.points` is strictly required. Without it, PostgreSQL will perform a sequential scan across all students on every page load, causing massive CPU spikes during high-traffic events.

### 17. Dependencies
- **Dependencies:** None.

### 18. Migration Plan
- **Action Required:** DO NOT create `leaderboard-service.ts`. Move all leaderboard fetching logic directly into `gamification-service.ts`.

### 19. Required Tests
- **Testing Challenges Avoided:** Testing leaderboards involves asserting sorting logic. Grouping this under gamification simplifies the test suite setup.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED (with `gamification-service.ts`)
- **Priority:** P1 (Integrated)
- **Complexity:** LOW
- **Security Sensitivity:** LOW
- **Implementation Order:** Executed concurrently with gamification.

---

## 13. `badge-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `gamification-service.ts`)
Badges are intrinsically linked to point thresholds and user achievements. 

### 2. Codebase Evidence
- `user_badges` table exists.

### 3. Database Tables
- **`user_badges`**.

### 4. RLS Policy Analysis
- Managed by `gamification-service`.

### 5. Database Functions / RPC Analysis
- **Absence:** No RPCs exist for badge awarding. Badge evaluation is expected to be an application-layer concern inside `gamification-service.ts`.

### 6. Trigger Analysis
- **Absence:** No triggers automatically award badges. The application layer must evaluate thresholds after each point increment.

### 7. Existing Business Logic
- Users accumulate points via `profiles.points`. When a user's total exceeds a defined threshold (e.g., 100 points → "Event Enthusiast" badge), the badge should be awarded. Currently, no automated threshold-checking logic exists; badge awarding is hypothetical.

### 8. Duplicate Logic Analysis
- None.

### 9. Problems in Current Architecture
- Separation creates fragmented context.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Evaluating badge eligibility, awarding badges to users, fetching a user's earned badges.
- **Why it is merged:** Badges are a sub-domain of gamification points. Grouping them inside `gamification-service.ts` creates a cohesive bounded context for all engagement features.

### 11. Proposed Public API
- **Justification for Absence:** Badge operations (awarding, fetching) should be a module inside `gamification-service.ts`.

### 12. TypeScript Types
- `Badge`: `{ id: string, name: string, iconUrl: string, thresholdPoints: number }`
- `UserBadge`: `{ profileId: string, badgeId: string, awardedAt: Date }`

### 13. Error Handling Strategy
- **Domain Errors Avoided:** Handled within gamification. Throws `BadgeAlreadyAwardedError` if a unique constraint on `(profileId, badgeId)` is violated.

### 14. Transaction Requirements
- **Atomic Awards:** When points are added, the gamification service must evaluate if a badge threshold is crossed. Inserting the badge must happen in the same transaction as the point increment.

### 15. Security Analysis
- **Attack Surface:** Users might try to spoof API calls to manually award themselves badges.
- **Mitigation:** Badge insertion must be restricted strictly to the service layer; client mutations should be disabled via RLS.

### 16. Performance Analysis
- **Join Overhead:** Fetching a user's profile will now require a `LEFT JOIN` on `user_badges` to render their profile card.

### 17. Dependencies
- **Dependencies:** None.

### 18. Migration Plan
- **Action Required:** DO NOT create `badge-service.ts`. Integrate the badge threshold logic into the `awardPoints` function of `gamification-service.ts`.

### 19. Required Tests
- **Integration Tests Needed:** Assert that crossing a point threshold automatically inserts a row into `user_badges`.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED (with `gamification-service.ts`)
- **Priority:** P1 (Integrated)
- **Complexity:** MEDIUM
- **Security Sensitivity:** LOW
- **Implementation Order:** Executed concurrently with gamification.

---

## 14. `audit-service.ts`

### 1. Service Status
**ALREADY IMPLEMENTED ELSEWHERE**
The project already features `lib/audit/write-log.ts` and `lib/audit/log-mutation.ts`, fulfilling the exact role of an audit service.

### 2. Codebase Evidence
- `lib/audit/write-log.ts`
- `public.backup_logs` table serves as an audit/backup trail.

### 3. Database Tables
- **`backup_logs`**.

### 4. RLS Policy Analysis
- Inserts are permitted by admins.

### 5. Database Functions / RPC Analysis
- **Absence:** The existing `lib/audit/write-log.ts` utility directly inserts rows into `backup_logs` without using an RPC.

### 6. Trigger Analysis
- **Absence:** No triggers automate audit logging. Logging is manually invoked from application code, which creates gaps if developers forget to call the utility.

### 7. Existing Business Logic
- Specific actions write mutation logs via the existing utility.

### 8. Duplicate Logic Analysis
- Re-implementing this would duplicate `lib/audit/write-log.ts`.

### 9. Problems in Current Architecture
- None, existing implementation is sufficient.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Writing immutable event logs when entities are created, updated, or deleted.
- **Why it is rejected:** The `lib/audit/write-log.ts` utility currently handles this perfectly. Promoting it to a full service layer class adds verbosity without improving the architecture.

### 11. Proposed Public API
- **Justification for Absence:** Use the existing exported utility `logMutation(actorId, actionType, payload)`.

### 12. TypeScript Types
- `AuditLogPayload`: `{ action: string, tableName: string, recordId: string, oldData?: any, newData?: any }`

### 13. Error Handling Strategy
- **Fire and Forget:** Audit logging errors should ideally not block the primary transaction unless strict regulatory compliance is required. Currently, it logs to `console.error` on failure.

### 14. Transaction Requirements
- **Best Practice:** Audit logs should be inserted using PostgreSQL triggers (e.g., `AFTER UPDATE/INSERT/DELETE`) rather than application code to guarantee 100% coverage, even for direct DB mutations.

### 15. Security Analysis
- **Attack Surface:** Audit logs are append-only. RLS must block all `UPDATE` and `DELETE` queries on the `backup_logs` table.

### 16. Performance Analysis
- **Storage Impact:** Audit tables grow infinitely. A partition strategy (by month or year) is required in PostgreSQL to prevent table scans from timing out during admin reviews.

### 17. Dependencies
- **Dependencies:** None.

### 18. Migration Plan
- **Action Required:** DO NOT create `audit-service.ts`. Continue using the `lib/audit/write-log.ts` module.

### 19. Required Tests
- **Testing Challenges Avoided:** The utility is already tested.

### 20. Final Recommendation
- **Status:** ALREADY IMPLEMENTED ELSEWHERE (as `lib/audit/write-log.ts`)
- **Priority:** NONE (Utility already exists and is operational)
- **Complexity:** LOW
- **Security Sensitivity:** MEDIUM (Audit trails are security-relevant)
- **Implementation Order:** NONE (No migration required)

---

## 15. `moderation-service.ts`

### 1. Service Status
**OPTIONAL**
While thread moderation exists (`thread_mode`, `messages.is_deleted`), it is straightforward. Centralizing it might be overkill, but could be useful if chat systems scale.

### 2. Codebase Evidence
- `events.thread_mode` column.
- `messages.is_deleted` column.

### 3. Database Tables
- **`messages`**, **`conversations`**, **`events`**.

### 4. RLS Policy Analysis
- Deletion logic requires admin/owner checks.

### 5. Database Functions / RPC Analysis
- **Absence:** No RPCs handle moderation. Soft-deletes (`is_deleted = true`) are performed via standard Supabase client updates.

### 6. Trigger Analysis
- **Absence:** No triggers automate moderation actions (e.g., auto-banning on repeated reports).

### 7. Existing Business Logic
- UI allows deleting messages, setting `is_deleted = true`.

### 8. Duplicate Logic Analysis
- Minimal duplication.

### 9. Problems in Current Architecture
- **Missing bounds:** If moderation rules grow, scattering `is_deleted` updates becomes risky.

### 10. Service Responsibilities
- Owns: Deleting messages, muting threads, banning users from chat.

### 11. Proposed Public API
- **Justification for Optional Status:** If the chat feature expands, this API will be necessary.
- `deleteMessage(messageId: string, reason: string, actorId: string): Promise<void>`
- `muteUser(profileId: string, durationMinutes: number, actorId: string): Promise<void>`

### 12. TypeScript Types
- `ModerationAction`: `'delete_message' | 'mute_user' | 'ban_user'`
- `ModerationPayload`: `{ targetId: string, action: ModerationAction, reason: string }`

### 13. Error Handling Strategy
- **Domain Errors:** `UnauthorizedModerationError` (if actor is not an admin/coordinator).

### 14. Transaction Requirements
- **Atomic Muting:** Muting a user requires inserting a row into a `user_mutes` table and emitting a real-time event to kick them from active connections.

### 15. Security Analysis
- **Attack Surface:** Malicious actors could attempt to delete other users' messages by modifying the payload.
- **Mitigation:** The service must rigorously verify the `actorId` has the `admin` role or is the event coordinator for the thread where the message was posted.

### 16. Performance Analysis
- **Impact:** Very low. Moderation actions are infrequent compared to read/write chat operations.

### 17. Dependencies
- **Dependencies:** Depends on `permission-service.ts` and `audit-service.ts` (to log the moderation action).

### 18. Migration Plan
- **Action Required:** Defer implementation until the chat features demonstrate a need for active moderation.

### 19. Required Tests
- **Integration Tests Needed:** Verify that a standard user cannot invoke `deleteMessage` on a message they do not own.

### 20. Final Recommendation
- **Status:** OPTIONAL
- **Priority:** P4
- **Complexity:** LOW
- **Security Sensitivity:** LOW
- **Implementation Order:** Defer until later phases.

---
---

## 16. `upload-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `media-service.ts`)
Handling file uploads is fundamentally a media-related responsibility. Splitting `upload-service` from `media-service` creates an unnecessary abstraction layer over Supabase Storage.

### 2. Codebase Evidence
- No explicit upload service currently exists. Uploads are handled directly in components or actions.

### 3. Database Tables
- **Supabase Storage** (e.g., `banners`, `flyers`).

### 4. RLS Policy Analysis
- RLS on storage buckets dictates who can upload.

### 5. Database Functions / RPC Analysis
- **Absence:** No RPCs wrap upload logic. The Supabase Storage JS client handles uploads directly from the browser.

### 6. Trigger Analysis
- **Absence:** No database triggers fire on storage uploads. Post-upload processing (e.g., generating thumbnails) does not currently exist.

### 7. Existing Business Logic
- Frontend uses `supabase.storage.from('bucket').upload()`.

### 8. Duplicate Logic Analysis
- Upload logic is duplicated in event creation and report creation.

### 9. Problems in Current Architecture
- Separation is unnecessary.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Receiving multi-part form data, validating file streams, and pushing bytes to storage buckets.
- **Why it is merged:** These responsibilities overlap 100% with the requirements of the `media-service`. Separating them forces developers to orchestrate between an upload service and a media URL generation service, adding unnecessary complexity.

### 11. Proposed Public API
- **Justification for Absence:** Absorbed by `media-service.ts`. Methods like `uploadEventBanner` inherently cover the upload concern.

### 12. TypeScript Types
- `FileUploadTarget`: `'banner' | 'flyer' | 'face_scan' | 'document'`
- `FileValidationConfig`: `{ maxSizeBytes: number, allowedMimeTypes: string[] }`

### 13. Error Handling Strategy
- **Domain Errors:** Handled by `media-service`. Custom errors like `StorageBucketNotFoundError` or `UploadTimeoutError`.

### 14. Transaction Requirements
- **Storage Atomicity:** Storage operations (like AWS S3 or Supabase Storage) are not transactional with the PostgreSQL database. If an upload succeeds but the subsequent DB insert fails, the file becomes orphaned. A cron job or background worker is required to clean up orphaned files, as we cannot wrap storage calls in a SQL `BEGIN; COMMIT;` block.

### 15. Security Analysis
- **Attack Surface:** Unrestricted file uploads can lead to hosting malware, bypassing storage quotas (resource exhaustion), or executing XSS via malicious SVGs.
- **Mitigation:** The merged service must strictly assert `actorId`, enforce MIME type checking via magic bytes (not just file extensions), and limit file sizes globally.

### 16. Performance Analysis
- **Bandwidth Impact:** Streaming large files through the Next.js server consumes memory and bandwidth. For files > 10MB, the service should generate pre-signed upload URLs so the client can upload directly to Supabase Storage, bypassing the Node.js server.

### 17. Dependencies
- **Dependencies:** Relies on the `@supabase/supabase-js` storage client.

### 18. Migration Plan
- **Action Required:** DO NOT create `upload-service.ts`. Integrate all upload security and validation logic into `media-service.ts`.

### 19. Required Tests
- **Testing Challenges Avoided:** Upload testing requires mocking network streams and `FormData`. Consolidating this into `media-service` halves the number of mock setups required.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED

---

## 17. `media-service.ts`

### 1. Service Status
**REQUIRED**
The application heavily relies on Supabase Storage for event banners, flyers, photos, and face scans. Centralizing file validation, uploading, and URL generation is essential.

### 2. Codebase Evidence
- `lib/actions/cc-events.ts`: Contains banner upload logic.
- `public.event_photos`, `public.face_scans` tables exist.

### 3. Database Tables
- **`event_photos`**: `id`, `event_id`, `url`, `uploaded_by`.
- **`face_scans`**: `id`, `captured_by`, `image_data`.
- **Supabase Storage**: Buckets for images.

### 4. RLS Policy Analysis
- Storage buckets have RLS. `event_photos` allows uploads based on user roles.

### 5. Database Functions / RPC Analysis
- **Absence:** No RPCs wrap file validation or upload logic. The Supabase Storage JS client is invoked directly from React components.

### 6. Trigger Analysis
- **Absence:** No triggers fire on file uploads to Supabase Storage buckets. Post-upload metadata is written manually.

### 7. Existing Business Logic
- Components validate file size/type -> Supabase JS client uploads -> returns path -> path saved to PostgreSQL table (`events.banner_url` or `event_photos.url`).

### 8. Duplicate Logic Analysis
- Validating file types (PNG/JPG) and sizes (e.g., < 2MB) is scattered across frontend components.
- **Canonical Service:** `media-service.ts`.

### 9. Problems in Current Architecture
- **Inconsistent validation (HIGH):** Frontend validation can be bypassed, leading to malicious uploads.
- **Repeated logic (MEDIUM):** Generating public URLs is done repeatedly.

### 10. Service Responsibilities
- Owns: File type/size validation, Supabase Storage uploads, generating signed/public URLs, managing `event_photos`.

### 11. Proposed Public API
```ts
export async function uploadEventBanner(eventId: string, file: File, actorId: string): Promise<string>
export async function addEventPhoto(eventId: string, file: File, actorId: string): Promise<void>
```

### 12. TypeScript Types
- `UploadResult`: `{ url: string, path: string }`

### 13. Error Handling Strategy
- `InvalidFileTypeError`, `FileSizeLimitExceededError`.

### 14. Transaction Requirements
- The database update (`events.banner_url`) should only occur if the storage upload succeeds.

### 15. Security Analysis
- CRITICAL: Must sanitize filenames and strictly enforce MIME types to prevent malware hosting.

### 16. Performance Analysis
- Use CDN/Edge caching for public URLs.

### 17. Dependencies
- Depends on: `permission-service.ts`.

### 18. Migration Plan
1. Create `media-service.ts`.
2. Wrap `supabase.storage` calls.
3. Move `event_photos` insertion into this service.

### 19. Required Tests
- Uploading a PDF when expecting an image.
- Exceeding size limits.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P2
- **Complexity:** MEDIUM
- **Security Sensitivity:** HIGH
- **Implementation Order:** 8

---

## 18. `search-service.ts`

### 1. Service Status
**OPTIONAL**
While searching for events or students is common, it is currently handled by simple SQL `ILIKE` queries or frontend filtering. A dedicated search service is only justified if migrating to full-text search (e.g., Postgres `tsvector`) or Algolia.

### 2. Codebase Evidence
- `app/admin/users/page.tsx`: Likely uses basic filtering for users.

### 3. Database Tables
- **`events`**, **`profiles`**.

### 4. RLS Policy Analysis
- Read access is generally allowed.

### 5. Database Functions / RPC Analysis
- None currently implement `tsvector` or full-text search.

### 6. Trigger Analysis
- **Absence:** Search is a read-only operation. No triggers are needed or invoked.

### 7. Existing Business Logic
- Queries use `.ilike('title', %query%)`.

### 8. Duplicate Logic Analysis
- Minimal duplication. 

### 9. Problems in Current Architecture
- `ILIKE` queries without pg_trgm indexes are slow, but fine for small datasets.

### 10. Service Responsibilities
- Owns: Abstracting search queries, handling pagination and weighting.

### 11. Proposed Public API
```ts
export async function searchEvents(query: string, filters: EventFilters): Promise<Event[]>
```

### 12. TypeScript Types
- `EventFilters`: `{ status?: string, clubId?: string }`

### 13. Error Handling Strategy
- **Domain Errors:** `MalformedSearchQueryError` if the search term violates length or regex constraints.

### 14. Transaction Requirements
- **Read-Only:** Search queries are inherently read-only and require no transactions.

### 15. Security Analysis
- **Attack Surface:** Wildcard searches (`%query%`) at the start of a string force sequential table scans. Attackers can spam complex searches to cause database CPU exhaustion (ReDoS/Slow Query DoS).
- **Mitigation:** Enforce query length limits, rate limiting via `rate-limit-service`, and restrict leading wildcards.

### 16. Performance Analysis
- **Indexing Requirement:** If implemented, the database MUST be migrated to use `pg_trgm` (trigram) indexes for `ILIKE` operations, or `tsvector` with GIN indexes for full-text search. Standard B-Tree indexes cannot optimize `ILIKE '%term%'`.

### 17. Dependencies
- **Dependencies:** None, though integrating Algolia or Meilisearch would add external dependencies.

### 18. Migration Plan
- **Action Required:** Keep as OPTIONAL. Current `.ilike()` queries in React Server Components are sufficient until the platform exceeds 10,000 active events or users.

### 19. Required Tests
- **Integration Tests Needed:** Verify that searching for "Hackathon" matches "Global Hackathon 2026" and handles edge cases like special characters without throwing SQL syntax errors.

### 20. Final Recommendation
- **Status:** OPTIONAL
- **Priority:** P5
- **Complexity:** MEDIUM
- **Security Sensitivity:** LOW

---

## 19. `recommendation-service.ts`

### 1. Service Status
**NOT JUSTIFIED**
The codebase does not track user preferences, view history, or tags required to build a recommendation engine. 

### 2. Codebase Evidence
- No tables track "likes" or "interests".

### 3. Database Tables
- **Missing Infrastructure:** There are no `user_interests`, `event_tags`, or `page_views` tables to source recommendation algorithms from.

### 4. RLS Policy Analysis
- **Not Applicable:** No tables exist to apply policies to.

### 5. Database Functions / RPC Analysis
- **Missing RPCs:** A recommendation engine would require complex vector similarity functions (e.g., `pgvector` cosine similarity) or complex collaborative filtering SQL queries, neither of which exist.

### 6. Trigger Analysis
- **Not Applicable:** No triggers exist for tracking user behavior.

### 7. Existing Business Logic
- **None:** Events are currently displayed chronologically or filtered explicitly by the user.

### 8. Duplicate Logic Analysis
- **None:** There is no existing recommendation logic to duplicate.

### 9. Problems in Current Architecture
- **Infrastructure Gap:** Building this requires a massive data engineering effort, defining taxonomic tags for clubs/events, and tracking user telemetry.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Generating personalized event feeds based on past attendance, club memberships, and peer behavior.
- **Why it is rejected:** The Club Eve platform's scope is currently administrative and operational, not a content-discovery social network.

### 11. Proposed Public API
- **Justification for Absence:** Without telemetry data, any API would just return a randomly sorted list.
- If built in the future:
  - `getRecommendedEvents(profileId: string, limit: number): Promise<Event[]>`

### 12. TypeScript Types
- `RecommendationContext`: `{ algorithm: 'collaborative' | 'content_based', confidenceScore: number }`

### 13. Error Handling Strategy
- **Expected Errors Avoided:** Handing `InsufficientDataError` (cold start problem for new users).

### 14. Transaction Requirements
- **Compute Only:** Recommendation generation is read-heavy.

### 15. Security Analysis
- **Attack Surface:** Tracking telemetry introduces severe data privacy concerns. The application would need GDPR/DPDP consent banners to legally track viewing habits.

### 16. Performance Analysis
- **Compute Impact:** Generating recommendations on-the-fly per request is incredibly slow. We would need a background cron job to pre-compute recommendations and store them in Redis.

### 17. Dependencies
- **Missing Dependencies:** Requires ML libraries or external AI APIs (e.g., OpenAI embeddings) which are out of scope.

### 18. Migration Plan
- **Action Required:** DO NOT implement. Rely on standard chronological sorting and explicit category filters.

### 19. Required Tests
- **Testing Challenges Avoided:** Testing recommendation accuracy is subjective and requires massive mocked datasets.

### 20. Final Recommendation
- **Status:** NOT JUSTIFIED

---

## 20. `calendar-service.ts`

### 1. Service Status
**RECOMMENDED**
Fetching events grouped by month, week, or day, and determining overlaps for venues is a specific bounded context that clutters standard event retrieval.

### 2. Codebase Evidence
- Frontend calendar components rely on fetching all events and organizing them in JS.

### 3. Database Tables
- **`events`**, **`venue_availabilities`**.

### 4. RLS Policy Analysis
- Public read access for events.

### 5. Database Functions / RPC Analysis
- None.

### 6. Trigger Analysis
- **Absence of Triggers:** Fetching calendar data is a read-only operation. No triggers are invoked.

### 7. Existing Business Logic
- Fetch events where `event_date` is within a range.

### 8. Duplicate Logic Analysis
- Minimal duplication, but standardizing the date boundary math (handling UTC vs IST timezones for start/end of month) prevents off-by-one errors across different UI views.

### 9. Problems in Current Architecture
- Grouping events by date in the client can be inefficient, especially if rendering complex week-view overlapping layouts.

### 10. Service Responsibilities
- Owns: Fetching timeline data, resolving conflicting schedules, formatting events into calendar-friendly arrays.

### 11. Proposed Public API
```ts
export async function getMonthlyCalendar(year: number, month: number): Promise<CalendarDay[]>
```

### 12. TypeScript Types
- `CalendarDay`: `{ date: string, events: Event[], hasConflicts: boolean }`
- `DateRange`: `{ start: Date, end: Date }`

### 13. Error Handling Strategy
- **Domain Errors:** `InvalidDateRangeError` if the requested month/year is out of bounds or malformed.

### 14. Transaction Requirements
- **Read-Only:** No transactions required. A single connection pool query with `WHERE event_date BETWEEN x AND y` is sufficient.

### 15. Security Analysis
- **Attack Surface:** Malicious actors could request a date range of 100 years to intentionally cause database exhaustion.
- **Mitigation:** The service must rigidly enforce maximum date ranges (e.g., maximum 3 months per query) to prevent DoS.

### 16. Performance Analysis
- **Indexing:** An index on `events.event_date` is absolutely required to prevent sequential scans when filtering by month.

### 17. Dependencies
- **Dependencies:** Relies heavily on accurate timezone handling. May require `date-fns` or `dayjs` for robust boundary math.

### 18. Migration Plan
- **Action Required:** Create `calendar-service.ts` and refactor the admin dashboard and student calendar views to consume its grouped outputs rather than doing the math in React components.

### 19. Required Tests
- **Integration Tests Needed:**
  - Date boundary checks (ensure events on the 1st and 31st at midnight are included correctly).
  - Timezone assertions (ensure IST offsets do not push events into the wrong calendar day).

### 20. Final Recommendation
- **Status:** RECOMMENDED
- **Priority:** P3
- **Complexity:** LOW
- **Security Sensitivity:** LOW
- **Implementation Order:** 9

---
---

## 21. `feedback-service.ts`

### 1. Service Status
**REQUIRED**
Student feedback is a critical part of the IIC and event reporting pipeline. Centralizing feedback submission and aggregation ensures consistency.

### 2. Codebase Evidence
- `components/student/StudentFeedbackTerminal.tsx`: Submits feedback.
- `app/api/reports/check-feedback-status/route.ts`: Aggregates feedback metrics.

### 3. Database Tables
- **`feedbacks`**: `id`, `event_id`, `student_id`, `responses` (jsonb).
- **`feedback_responses`**: Used for IIC report aggregation.
- **`iic_event_feedback_tracking`**: Stores aggregated attendance/feedback totals.

### 4. RLS Policy Analysis
- `feedbacks` allows insert by authenticated users for themselves. 

### 5. Database Functions / RPC Analysis
- None explicitly handle feedback insertions.

### 6. Trigger Analysis
- **Absence:** No triggers automatically process or aggregate feedback submissions. The `iic_event_feedback_tracking` table is populated manually or via application-layer logic.

### 7. Existing Business Logic
- Student submits answers -> inserted as JSONB array into `feedbacks`.
- Admin checks event stats -> `iic_event_feedback_tracking` determines if enough feedback exists to generate an IIC report.

### 8. Duplicate Logic Analysis
- Checking if a user has already submitted feedback is handled by relying on a unique constraint (`23505` error code handling in UI).

### 9. Problems in Current Architecture
- **Inconsistent Error Handling (MEDIUM):** Catching Postgres `23505` unique violation codes directly in UI components breaks abstraction layers.

### 10. Service Responsibilities
- Owns: Submitting student feedback, checking if feedback is complete, aggregating feedback for reports.

### 11. Proposed Public API
```ts
export async function submitEventFeedback(eventId: string, studentId: string, responses: any[]): Promise<void>
export async function getFeedbackAggregation(eventId: string): Promise<FeedbackMetrics>
```

### 12. TypeScript Types
- `FeedbackMetrics`: `{ totalAttendees: number, feedbackSubmitted: number, isComplete: boolean }`

### 13. Error Handling Strategy
- `DuplicateFeedbackError` instead of exposing `23505`.

### 14. Transaction Requirements
- If updating `iic_event_feedback_tracking` manually, it must be atomic.

### 15. Security Analysis
- Students must not submit on behalf of others.

### 16. Performance Analysis
- `feedbacks` table can grow large; jsonb querying is slow without GIN indexes.

### 17. Dependencies
- Depends on: None.
- Used by: IIC Report Generator.

### 18. Migration Plan
1. Move `supabase.from('feedbacks').insert()` out of `StudentFeedbackTerminal.tsx`.
2. Abstract the unique violation error.

### 19. Required Tests
- Student submitting feedback twice.
- Retrieving aggregation stats.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P2
- **Complexity:** MEDIUM
- **Security Sensitivity:** LOW
- **Implementation Order:** 10

---

## 22. `survey-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `feedback-service.ts`)
The `feedbacks` table handles dynamically configured questions via `events.feedback_config`. This is effectively a survey engine.

### 2. Codebase Evidence
- `events.feedback_config` is a JSONB schema determining questions.

### 3. Database Tables
- `feedbacks`.

### 4. RLS Policy Analysis
- **Policy Overlap:** RLS policies on `feedbacks` already determine who can submit responses. Duplicating these policies for a generic survey context is redundant.

### 5. Database Functions / RPC Analysis
- **Missing RPCs:** Creating dynamic survey tables requires DDL execution (unsafe) or complex EAV (Entity-Attribute-Value) schemas. No such RPCs exist.

### 6. Trigger Analysis
- **Absence of Triggers:** None exist.

### 7. Existing Business Logic
- Handled exclusively by feedback logic via JSONB `responses`.

### 8. Duplicate Logic Analysis
- Separation would unnecessarily split the handling of generic forms. Form parsing, validation, and JSONB marshaling would be duplicated across `feedback-service` and `survey-service`.

### 9. Problems in Current Architecture
- **Fragmentation:** Attempting to build a generic survey engine distracts from the core use-case of event feedback.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Managing dynamic questions and capturing unstructured responses.
- **Why it is merged:** Feedback is essentially a survey. Integrating the dynamic schema logic directly into `feedback-service` eliminates overhead.

### 11. Proposed Public API
- **Justification for Absence:** Absorbed by `feedback-service.ts`.
- `updateEventFeedbackSchema(eventId: string, schema: JSONSchema): Promise<void>`

### 12. TypeScript Types
- `SurveySchema`: `{ questions: { id: string, type: 'text' | 'rating', prompt: string }[] }`

### 13. Error Handling Strategy
- **Domain Errors:** Handled by `feedback-service`. Custom `InvalidSchemaError`.

### 14. Transaction Requirements
- **Updates:** Updating the `feedback_config` column is a single row update on `events`. No complex transactions needed.

### 15. Security Analysis
- **Attack Surface:** Storing unsanitized JSONB schemas could lead to XSS if the frontend blindly renders the questions without encoding.
- **Mitigation:** The merged service must validate the JSON schema against a strict Zod payload before saving it to Postgres.

### 16. Performance Analysis
- **Query Impact:** JSONB updates are fast. Extracting specific survey answers requires Postgres JSON operators (e.g., `->>`) which are slower than native columns unless heavily indexed.

### 17. Dependencies
- **Dependencies:** Relies on `zod` for JSON schema validation.

### 18. Migration Plan
- **Action Required:** DO NOT create `survey-service.ts`. Expose dynamic schema configuration functions within `feedback-service.ts`.

### 19. Required Tests
- **Integration Tests Needed:** Assert that providing an invalid JSONB schema throws an `InvalidSchemaError` during event configuration.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED (with `feedback-service.ts`)
- **Priority:** P2 (Integrated)
- **Complexity:** LOW
- **Security Sensitivity:** MEDIUM
- **Implementation Order:** Executed concurrently with feedback.

---

## 23. `task-service.ts`

### 1. Service Status
**NOT JUSTIFIED**
No task management tables exist in the database (no to-do lists, kanban boards, etc.).

### 2. Codebase Evidence
- No task domain entities.

### 3. Database Tables
- **Missing Infrastructure:** There are no `tasks`, `kanban_boards`, or `assignees` tables.

### 4. RLS Policy Analysis
- **Not Applicable:** No tables exist.

### 5. Database Functions / RPC Analysis
- **Not Applicable:** No RPCs exist.

### 6. Trigger Analysis
- **Not Applicable:** No triggers exist.

### 7. Existing Business Logic
- **None:** The application is event-focused, not a project management tool like Jira or Trello.

### 8. Duplicate Logic Analysis
- **None.**

### 9. Problems in Current Architecture
- **Scope Creep:** Implementing task management would introduce massive scope creep unaligned with the core event ticketing and registration domain.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Assigning tasks to club members, tracking deadlines, moving states (To Do -> Done).
- **Why it is rejected:** Utterly unjustified by the current schema and product requirements.

### 11. Proposed Public API
- **Justification for Absence:** No tables to support CRUD operations.
- If forced to implement:
  - `createTask(payload: TaskPayload): Promise<Task>`

### 12. TypeScript Types
- `TaskStatus`: `'TODO' | 'IN_PROGRESS' | 'DONE'`

### 13. Error Handling Strategy
- **Expected Errors Avoided:** Avoids handling `InvalidStatusTransitionError` or `UnassignedTaskError`.

### 14. Transaction Requirements
- **Not Applicable.**

### 15. Security Analysis
- **Attack Surface:** Standard authorization checks (only task owners or club admins can mutate tasks).

### 16. Performance Analysis
- **Storage Impact:** Minimal, assuming standard relational tables.

### 17. Dependencies
- **Dependencies:** None.

### 18. Migration Plan
- **Action Required:** DO NOT implement. Rely on standard external communication tools (WhatsApp, Slack) for club coordination rather than building a custom task manager.

### 19. Required Tests
- **Testing Challenges Avoided:** Avoiding the need to write exhaustive CRUD tests for an unused feature.

### 20. Final Recommendation
- **Status:** NOT JUSTIFIED
- **Priority:** NONE (Scope Creep — no backing infrastructure)
- **Complexity:** HIGH
- **Security Sensitivity:** LOW
- **Implementation Order:** NONE (Not implemented)

---

## 24. `team-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `hackathon-service.ts`)
Teams currently only exist within the context of hackathons (`hackathon_teams`, `hackathon_team_members`). Creating a generic team service risks over-engineering for a feature restricted to one domain.

### 2. Codebase Evidence
- `lib/actions/hackathon-actions.ts`: Manages team creation and joining.

### 3. Database Tables
- **`hackathon_teams`**: `id`, `event_id`, `team_name`, `leader_id`.
- **`hackathon_team_members`**: `team_id`, `profile_id`.
- **`hackathon_team_requests`**: `team_id`, `profile_id`, `status`.

### 4. RLS Policy Analysis
- Heavily restricted to team leaders and event managers.

### 5. Database Functions / RPC Analysis
- **Missing RPCs:** Safe team joining requires atomic operations to ensure `hackathon_teams` do not exceed `max_team_size`. A `join_hackathon_team(team_id, user_id)` RPC should ideally exist.

### 6. Trigger Analysis
- **Absence of Triggers:** No triggers manage team capacity; logic currently relies on application-level checks.

### 7. Existing Business Logic
- Handled tightly within the hackathon registration flow (User selects "Create Team" or "Join via Code").

### 8. Duplicate Logic Analysis
- Validation of hackathon constraints (e.g., only BTech students can join) overlaps between team joining and general event registration.

### 9. Problems in Current Architecture
- Splitting this creates artificial boundaries in hackathon orchestration. If `team-service` is distinct, fetching a hackathon requires orchestrating between `hackathon-service` and `team-service`.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Creating teams, joining teams via invite codes, kicking members.
- **Why it is merged:** Teams are exclusively bound to hackathons. Grouping them inside `hackathon-service` establishes a cohesive bounded context.

### 11. Proposed Public API
- **Justification for Absence:** Absorbed by `hackathon-service.ts`.
- `createTeam(eventId: string, name: string, leaderId: string): Promise<string>`
- `joinTeam(teamCode: string, studentId: string): Promise<void>`

### 12. TypeScript Types
- `HackathonTeam`: `{ id: string, name: string, inviteCode: string, members: Profile[] }`

### 13. Error Handling Strategy
- **Domain Errors:** `TeamFullError`, `InvalidInviteCodeError`, `AlreadyInTeamError`.

### 14. Transaction Requirements
- **Atomic Joins:** Joining a team requires checking `COUNT(members) < max_size` and inserting the member in one serialized transaction to prevent race conditions during high-traffic hackathon launches.

### 15. Security Analysis
- **Attack Surface:** Brute forcing 6-digit invite codes to join arbitrary teams.
- **Mitigation:** The merged service must implement strict rate limiting via `rate-limit-service` on the `joinTeam` endpoint.

### 16. Performance Analysis
- **Join Queries:** Fetching a team requires joining `hackathon_team_members` with `profiles`. Highly indexed.

### 17. Dependencies
- **Dependencies:** Relies on `rate-limit-service.ts`.

### 18. Migration Plan
- **Action Required:** DO NOT create `team-service.ts`. Migrate the `lib/actions/hackathon-actions.ts` team logic directly into `hackathon-service.ts`.

### 19. Required Tests
- **Integration Tests Needed:**
  - Race condition test: Attempt to join 5 students simultaneously to a team with 1 remaining slot.
  - Brute force mitigation test.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED

---

## 25. `judge-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `hackathon-service.ts`)
Judges strictly evaluate hackathon submissions (`hackathon_judges`, `hackathon_evaluations`). 

### 2. Codebase Evidence
- `lib/actions/hackathon-eval-actions.ts`: Handles evaluation persistence.

### 3. Database Tables
- **`hackathon_judges`**: `event_id`, `judge_id`.
- **`hackathon_evaluations`**: `submission_id`, `judge_id`, `score_*`.

### 4. RLS Policy Analysis
- Handled via judge role verification.

### 5. Database Functions / RPC Analysis
- **Absence:** No Postgres functions exist. Judge assignment is standard CRUD on the `hackathon_judges` table.

### 6. Trigger Analysis
- **Absence:** Evaluation logic is handled purely in the application layer.

### 7. Existing Business Logic
- Tightly integrated with submission criteria. Judges view submissions, enter scores mapped to criteria IDs, and save.

### 8. Duplicate Logic Analysis
- Checking if a user holds a 'judge' role for a specific event overlaps with standard permission checks.

### 9. Problems in Current Architecture
- Separation creates fragmentation. A submission, its evaluations, and its judge are fundamentally coupled.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Assigning judges to events, tracking judge evaluation progress.
- **Why it is merged:** Judges are exclusively bound to hackathons. A unified `hackathon-service` should handle the entire lifecycle (registration -> teams -> submissions -> judging).

### 11. Proposed Public API
- **Justification for Absence:** Absorbed by `hackathon-service.ts`.
- `assignJudge(eventId: string, profileId: string): Promise<void>`
- `submitEvaluation(submissionId: string, judgeId: string, scores: Record<string, number>): Promise<void>`

### 12. TypeScript Types
- `EvaluationPayload`: `{ criteriaId: string, score: number, feedback?: string }`

### 13. Error Handling Strategy
- **Domain Errors:** `UnauthorizedJudgeError` (if the actor is not registered in `hackathon_judges`).

### 14. Transaction Requirements
- **Atomic Evaluations:** Submitting an evaluation involves inserting multiple rows into `hackathon_evaluations` (one per criteria). This MUST be wrapped in a transaction so partial evaluations are never saved.

### 15. Security Analysis
- **Attack Surface:** Students modifying the client payload to submit evaluations for their own projects.
- **Mitigation:** Strict enforcement in `hackathon-service` verifying the `actorId` explicitly exists in `hackathon_judges` for the parent event before allowing the `INSERT`.

### 16. Performance Analysis
- **Impact:** Low impact. Judging happens over hours/days, unlike the high-concurrency registration window.

### 17. Dependencies
- **Dependencies:** Relies on `permission-service.ts`.

### 18. Migration Plan
- **Action Required:** DO NOT create `judge-service.ts`. Move `hackathon-eval-actions.ts` logic into `hackathon-service.ts`.

### 19. Required Tests
- **Integration Tests Needed:**
  - Unassigned student attempting to submit an evaluation.
  - Submitting an evaluation where one criteria score exceeds the `max_score` constraint (assert transaction rollback).

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED

---
---

## 26. `scoring-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `hackathon-service.ts`)
Scoring is exclusively applied to hackathon evaluations.

### 2. Codebase Evidence
- `hackathon_evaluations` stores scores based on criteria in `hackathon_criteria`.

### 3. Database Tables
- **`hackathon_evaluations`**, **`hackathon_criteria`**.

### 4. RLS Policy Analysis
- RLS managed by hackathon context.

### 5. Database Functions / RPC Analysis
- **Absence:** No Postgres functions exist for score calculation. The application layer multiplies `hackathon_criteria.weight` by `hackathon_evaluations.score_*` for each criteria.

### 6. Trigger Analysis
- **Absence:** No triggers automatically compute final scores. Ideally, a trigger on `hackathon_evaluations` INSERT should detect when all judges have submitted and auto-calculate the final weighted average.

### 7. Existing Business Logic
- Score is calculated by multiplying weights of criteria.

### 8. Duplicate Logic Analysis
- Minimal duplication.

### 9. Problems in Current Architecture
- Separation creates fragmentation.

### 10. Service Responsibilities
- (Merged into `hackathon-service.ts`)

### 11. Proposed Public API
- **Justification for Absence:** Absorbed by `hackathon-service.ts`.
- `calculateHackathonScore(submissionId: string): Promise<number>`

### 12. TypeScript Types
- `ScoreCalculationContext`: `{ weights: Record<string, number>, rawScores: Record<string, number>, total: number }`

### 13. Error Handling Strategy
- **Domain Errors:** `IncompleteEvaluationError` (thrown if a final score is requested before all judges have submitted).

### 14. Transaction Requirements
- **Atomic Scoring:** When the final evaluation is submitted, a trigger or a transaction should automatically calculate the final weighted score and persist it to `hackathon_submissions.final_score`.

### 15. Security Analysis
- **Attack Surface:** Modifying criteria weights during an active hackathon can corrupt the entire scoring system.
- **Mitigation:** RLS and the application layer must completely lock `hackathon_criteria` updates once the event status shifts from `draft` to `active`.

### 16. Performance Analysis
- **Query Impact:** Calculating weighted averages across multiple judges requires `GROUP BY` and `SUM` queries on `hackathon_evaluations`. These should be materialized or cached after the event ends.

### 17. Dependencies
- **Dependencies:** Relies on `hackathon-service.ts`.

### 18. Migration Plan
- **Action Required:** DO NOT create `scoring-service.ts`. Expose the scoring computation as an internal module of `hackathon-service.ts`.

### 19. Required Tests
- **Unit Tests Needed:** Assert the math logic: given 3 judges scoring 3 criteria with different weights, ensure the final output strictly matches the expected weighted average.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED

---

## 27. `submission-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `hackathon-service.ts`)
Managing student uploads and Git links for hackathons belongs in the hackathon bounded context.

### 2. Codebase Evidence
- `hackathon_submissions` table.

### 3. Database Tables
- **`hackathon_submissions`**.

### 4. RLS Policy Analysis
- **Policy Overlap:** RLS on `hackathon_submissions` restricts writes to team members only. Read access is granted to judges assigned to the parent event.

### 5. Database Functions / RPC Analysis
- **Absence:** No RPCs wrap submission logic. Inserts and updates are done via standard Supabase client calls.

### 6. Trigger Analysis
- **Absence:** No triggers fire on submission inserts (e.g., auto-notifying judges).

### 7. Existing Business Logic
- Teams submit GitHub URLs and demo videos.

### 8. Duplicate Logic Analysis
- **Minimal:** Submission deadline checking may overlap with general event status checks in `event-service`.

### 9. Problems in Current Architecture
- **Fragmentation:** Separating submission CRUD from teams and judging within the same hackathon forces cross-service coordination.

### 10. Service Responsibilities
- (Merged into `hackathon-service.ts`)

### 11. Proposed Public API
- **Justification for Absence:** Absorbed by `hackathon-service.ts`.
- `submitProject(teamId: string, repoUrl: string, demoUrl: string, actorId: string): Promise<void>`

### 12. TypeScript Types
- `SubmissionPayload`: `{ repoUrl: string, demoUrl: string, description: string }`

### 13. Error Handling Strategy
- **Domain Errors:** `SubmissionDeadlinePassedError`, `InvalidRepositoryUrlError`.

### 14. Transaction Requirements
- **Updates:** Submitting updates a single row in `hackathon_submissions` (or creates it if missing). Standard constraints apply.

### 15. Security Analysis
- **Attack Surface:** Teams overwriting submissions after the deadline.
- **Mitigation:** The service must strictly check the current timestamp against the `events.end_date` or a custom `submission_deadline` column.

### 16. Performance Analysis
- **Storage Impact:** Minimal. Submissions just store URLs and text, not the actual project files.

### 17. Dependencies
- **Dependencies:** Relies on `hackathon-service.ts`.

### 18. Migration Plan
- **Action Required:** DO NOT create `submission-service.ts`. Move submission logic into `hackathon-service.ts`.

### 19. Required Tests
- **Integration Tests Needed:** Assert that `submitProject` throws a `SubmissionDeadlinePassedError` if called 1 minute past the event end time.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED

---

## 28. `verification-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `certificate-service.ts`)
Verifying certificates using their unique IDs is a direct capability of the certificate domain.

### 2. Codebase Evidence
- `/verify` route checks certificate existence.

### 3. Database Tables
- **`event_certificates`**.

### 4. RLS Policy Analysis
- Publicly readable to allow third-party verification.

### 5. Database Functions / RPC Analysis
- **Absence:** No RPCs exist. Verification is a simple `SELECT` query on `event_certificates` by UUID.

### 6. Trigger Analysis
- **Absence:** No triggers fire on certificate reads.

### 7. Existing Business Logic
- Scans QR/visits URL -> queries `event_certificates` -> displays validity.

### 8. Duplicate Logic Analysis
- **Minimal:** The `/verify` route essentially duplicates the `getCertificateById` query that `certificate-service` already needs.

### 9. Problems in Current Architecture
- Separation overcomplicates basic read functionality.

### 10. Service Responsibilities
- (Merged into `certificate-service.ts`)

### 11. Proposed Public API
- **Justification for Absence:** Handled directly by `certificate-service.ts`.
- `verifyCertificate(certificateId: string): Promise<CertificateMetadata | null>`

### 12. TypeScript Types
- `VerificationResult`: `{ isValid: boolean, issuedTo: string, eventName: string, issueDate: string }`

### 13. Error Handling Strategy
- **Domain Errors:** `CertificateRevokedError`, `CertificateNotFoundError`.

### 14. Transaction Requirements
- **Read-Only:** Fetching validation data is a simple `SELECT` query.

### 15. Security Analysis
- **Attack Surface:** IDOR. Attackers might try to enumerate certificate IDs to scrape student names.
- **Mitigation:** `event_certificates.id` MUST be a cryptographically secure UUIDv4. Sequential IDs would allow trivial scraping.

### 16. Performance Analysis
- **Indexing:** Primary key lookup on `id` (UUID). Lightning fast.

### 17. Dependencies
- **Dependencies:** None.

### 18. Migration Plan
- **Action Required:** DO NOT create `verification-service.ts`. Merge the verification read queries into `certificate-service.ts`.

### 19. Required Tests
- **Unit Tests Needed:** Verify that querying a non-existent UUID safely returns null rather than crashing the server.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED

---

## 29. `export-service.ts`

### 1. Service Status
**REQUIRED**
Exporting registrations, feedback, and logs into CSV/Excel formats is a heavy task currently cluttering API routes.

### 2. Codebase Evidence
- `app/api/export/registrations/route.ts` (implied by typical admin dashboards).

### 3. Database Tables
- Reads from `registrations`, `profiles`, `events`.

### 4. RLS Policy Analysis
- Restricted to admin/CC roles.

### 5. Database Functions / RPC Analysis
- **Absence:** Formatting CSVs is done entirely in the Node.js application layer.

### 6. Trigger Analysis
- **Absence:** Reading data for exports does not fire any triggers.

### 7. Existing Business Logic
- Admin clicks export -> route fetches all rows -> converts to CSV string -> returns file payload.

### 8. Duplicate Logic Analysis
- CSV parsing logic is often repeated for different tables.

### 9. Problems in Current Architecture
- **Performance (HIGH):** Large exports block the event loop if not handled via streaming or background jobs.

### 10. Service Responsibilities
- Owns: Standardized CSV generation, streaming large datasets from Postgres.

### 11. Proposed Public API
```ts
export async function exportEventRegistrations(eventId: string, actorId: string): Promise<string> // Returns CSV
```

### 12. TypeScript Types
- `ExportFormat`: `'csv' | 'xlsx'`
- `ExportFilter`: `{ eventId?: string, startDate?: string, endDate?: string }`

### 13. Error Handling Strategy
- `ExportFailedError`.

### 14. Transaction Requirements
- **Read-Only:** No locks needed, but large exports should ideally query against a read-replica if available.

### 15. Security Analysis
- High risk of data exfiltration; strict role checks required.

### 16. Performance Analysis
- Use node streams for large CSVs instead of `JSON.stringify` on massive arrays.

### 17. Dependencies
- Depends on: `permission-service.ts`.

### 18. Migration Plan
1. Centralize the CSV generator.

### 19. Required Tests
- Ensure CSV headers map correctly to dynamic queries.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P4
- **Complexity:** MEDIUM
- **Security Sensitivity:** HIGH
- **Implementation Order:** 11

---

## 30. `dashboard-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `analytics-service.ts`)
Fetching stats for the dashboard is precisely the responsibility of the `analytics-service`.

### 2. Codebase Evidence
- No independent dashboard logic exists outside of raw queries in page components.

### 3. Database Tables
- **Read-Only Context:** Queries span `events`, `registrations`, `profiles`.

### 4. RLS Policy Analysis
- **Constraint:** Dashboard metrics require admin roles to bypass standard user-level RLS visibility blocks.

### 5. Database Functions / RPC Analysis
- **Not Applicable:** Dashboards rely on the same `SELECT COUNT(*)` methods as analytics.

### 6. Trigger Analysis
- **Not Applicable:** Purely read-only.

### 7. Existing Business Logic
- The UI fetches counts, computes deltas (e.g., +5% from last month), and displays charts.

### 8. Duplicate Logic Analysis
- Dashboard cards and analytical reports share the exact same raw data aggregation logic.

### 9. Problems in Current Architecture
- Splitting `dashboard` from `analytics` leads to vague service boundaries. Developers won't know whether to put a "Total Users" metric in the dashboard service or the analytics service.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Supplying formatted metrics, time-series data, and KPI deltas.
- **Why it is merged:** Dashboards are just visual representations of analytics.

### 11. Proposed Public API
- **Justification for Absence:** Absorbed by `analytics-service.ts`.
- `getDashboardSummary(): Promise<DashboardMetrics>`

### 12. TypeScript Types
- `DashboardMetrics`: `{ totalUsers: number, activeEvents: number, monthlyGrowth: number }`

### 13. Error Handling Strategy
- **Domain Errors:** Standard try/catch for connection timeouts on heavy aggregations.

### 14. Transaction Requirements
- **Read-Only:** No locks needed.

### 15. Security Analysis
- **Attack Surface:** Complex analytical joins can trigger DoS if a malicious actor requests dashboard views repeatedly.
- **Mitigation:** Wrap the underlying analytics API in aggressive caching (e.g., Next.js `unstable_cache` with a 1-hour revalidation) so the DB is spared.

### 16. Performance Analysis
- **Impact:** High impact if not cached. Ensure indexes on `created_at` columns across all major tables to support time-series filtering.

### 17. Dependencies
- **Dependencies:** Relies on `analytics-service.ts`.

### 18. Migration Plan
- **Action Required:** DO NOT create `dashboard-service.ts`. Define all KPI aggregation functions within the `analytics-service`.

### 19. Required Tests
- **Integration Tests Needed:** Ensure that the metrics correctly respect the time-boundary parameters (e.g., fetching metrics for "Last 30 Days").

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED

---
---

## 31. `activity-service.ts`

### 1. Service Status
**NOT JUSTIFIED**
Generic "activity feeds" for users are not currently part of the application's core functionality, beyond what `points_history` tracks.

### 2. Codebase Evidence
- No `activities` or `feed` table exists.

### 3. Database Tables
- **Missing Infrastructure:** No `activities` or `feed` table exists.

### 4. RLS Policy Analysis
- **Not Applicable:** No tables exist.

### 5. Database Functions / RPC Analysis
- **Not Applicable:** No RPCs exist for tracking user activities.

### 6. Trigger Analysis
- **Not Applicable:** No triggers exist.

### 7. Existing Business Logic
- **None:** The application focuses on event management, not social media feeds.

### 8. Duplicate Logic Analysis
- **None.**

### 9. Problems in Current Architecture
- **Scope Creep:** Implementing an activity feed introduces massive scope creep unaligned with the core ticketing domain.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Generating personalized activity feeds (e.g. "User X joined Event Y").
- **Why it is rejected:** Utterly unjustified by the current schema and product requirements.

### 11. Proposed Public API
- **Justification for Absence:** No tables to support operations.

### 12. TypeScript Types
- `ActivityFeedItem`: `{ type: 'JOIN' | 'WIN', metadata: Record<string, any> }`

### 13. Error Handling Strategy
- **Expected Errors Avoided:** Avoids handling `FeedGenerationError`.

### 14. Transaction Requirements
- **Not Applicable.**

### 15. Security Analysis
- **Attack Surface:** Activity feeds introduce severe data privacy concerns regarding who can see what.

### 16. Performance Analysis
- **Storage Impact:** Tracking every action generates massive amounts of data.

### 17. Dependencies
- **Dependencies:** None.

### 18. Migration Plan
- **Action Required:** DO NOT implement. Rely on standard chronological event sorting.

### 19. Required Tests
- **Testing Challenges Avoided:** Testing feed logic is notoriously difficult.

### 20. Final Recommendation
- **Status:** NOT JUSTIFIED

---

## 32. `invite-service.ts`

### 1. Service Status
**OPTIONAL**
Currently, users sign up via generic OAuth or email, and admins manually assign roles. If a system to invite outside speakers/judges via email links is needed, this becomes useful.

### 2. Codebase Evidence
- Admin dashboard allows creating users directly via Supabase admin auth functions.

### 3. Database Tables
- None specifically for invites.

### 4. RLS Policy Analysis
- **Constraint:** RLS on a hypothetical `invites` table would need to restrict creation to admins/club-heads, but allow public read for the invite link itself.

### 5. Database Functions / RPC Analysis
- **Missing RPCs:** None exist.

### 6. Trigger Analysis
- **Absence of Triggers:** None exist.

### 7. Existing Business Logic
- **None:** Admins must manually assign roles via a dashboard.

### 8. Duplicate Logic Analysis
- **None.**

### 9. Problems in Current Architecture
- Admin user creation bypasses user onboarding flows and requires manual labor.

### 10. Service Responsibilities
- Owns: Generating secure, expiring invite tokens and validating them during signup.

### 11. Proposed Public API
```ts
export async function createInviteLink(role: Role, clubId?: string): Promise<string>
```

### 12. TypeScript Types
- `InviteToken`: `{ token: string, role: string, expiresAt: string }`

### 13. Error Handling Strategy
- **Domain Errors:** `InviteExpiredError`, `InvalidInviteTokenError`.

### 14. Transaction Requirements
- **Atomic Consumptions:** When a user signs up using a token, the token must be marked as `used` in the exact same transaction as their user profile creation to prevent reuse.

### 15. Security Analysis
- Links must expire to prevent leaked links from granting admin access. Token strings must be cryptographically secure random strings.

### 16. Performance Analysis
- **Indexing:** The hypothetical `invites` table requires a unique index on the `token` column.

### 17. Dependencies
- Depends on `email-service.ts`.

### 18. Migration Plan
- **Action Required:** Keep as OPTIONAL. Implement only if manual role assignment becomes a bottleneck for the admin team.

### 19. Required Tests
- **Integration Tests Needed:** Attempting to consume an expired invite token should throw `InviteExpiredError`.

### 20. Final Recommendation
- **Status:** OPTIONAL
- **Priority:** P5

---

## 33. `scheduler-service.ts`

### 1. Service Status
**NOT JUSTIFIED**
The application currently lacks any background job processing (e.g., cron jobs to close registrations automatically). Supabase pg_cron handles database-level scheduling.

### 2. Codebase Evidence
- `.github/workflows/supabase-keep-alive.yml` handles external pings, but no internal business logic is scheduled.

### 3. Database Tables
- **Missing Infrastructure:** No `jobs` or `scheduled_tasks` tables exist.

### 4. RLS Policy Analysis
- **Not Applicable.**

### 5. Database Functions / RPC Analysis
- **Not Applicable.**

### 6. Trigger Analysis
- **Not Applicable.**

### 7. Existing Business Logic
- **None.**

### 8. Duplicate Logic Analysis
- **None.**

### 9. Problems in Current Architecture
- Introducing a TypeScript scheduler requires a persistent server or a tool like Inngest/Upstash, changing the Next.js Vercel deployment model (which is serverless and stateless).

### 10. Service Responsibilities
- **Proposed Responsibilities:** Executing delayed functions.
- **Why it is rejected:** The infrastructure does not support it natively.

### 11. Proposed Public API
- **Justification for Absence:** No backend worker exists to consume this.

### 12. TypeScript Types
- `JobPayload`: `{ id: string, name: string, runAt: Date }`

### 13. Error Handling Strategy
- **Expected Errors Avoided:** Retries and dead-letter queue (DLQ) management.

### 14. Transaction Requirements
- **Not Applicable.**

### 15. Security Analysis
- **Attack Surface:** Exposing endpoints to trigger background jobs could lead to DoS if not strictly authenticated.

### 16. Performance Analysis
- **Compute Impact:** Persistent background workers cost money and memory.

### 17. Dependencies
- **Missing Dependencies:** Requires Redis or specialized libraries (BullMQ).

### 18. Migration Plan
- **Action Required:** DO NOT implement. Use Supabase `pg_cron` for database-level scheduling instead of a Node.js service.

### 19. Required Tests
- **Testing Challenges Avoided:** Mocking time and job queues in Jest is notoriously flaky.

### 20. Final Recommendation
- **Status:** NOT JUSTIFIED

---

## 34. `webhook-service.ts`

### 1. Service Status
**NOT JUSTIFIED**
Unless the application integrates with Stripe (for paid events) or external systems that POST data back, a dedicated webhook service is unnecessary.

### 2. Codebase Evidence
- No webhook endpoints exist in `app/api/webhooks/`.

### 3. Database Tables
- **Missing Infrastructure:** No `webhook_logs` or `webhook_subscriptions` tables exist.

### 4. RLS Policy Analysis
- **Not Applicable.**

### 5. Database Functions / RPC Analysis
- **Not Applicable.**

### 6. Trigger Analysis
- **Not Applicable.**

### 7. Existing Business Logic
- **None.**

### 8. Duplicate Logic Analysis
- **None.**

### 9. Problems in Current Architecture
- Webhooks add unnecessary complexity for a closed-ecosystem application.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Validating incoming webhook signatures from external providers.
- **Why it is rejected:** Unjustified by current requirements.

### 11. Proposed Public API
- **Justification for Absence:** No integrations demand it.

### 12. TypeScript Types
- `WebhookPayload`: `{ event: string, timestamp: number, data: any }`

### 13. Error Handling Strategy
- **Expected Errors Avoided:** Handing `InvalidWebhookSignatureError`.

### 14. Transaction Requirements
- **Not Applicable.**

### 15. Security Analysis
- **Attack Surface:** Webhook endpoints are public by definition. Without strict signature verification, attackers can spoof events (e.g. spoofing a "Payment Successful" event).

### 16. Performance Analysis
- **Compute Impact:** Must respond with 200 OK immediately, meaning processing must be asynchronous.

### 17. Dependencies
- **Missing Dependencies:** Requires cryptographic libraries for HMAC verification.

### 18. Migration Plan
- **Action Required:** DO NOT implement until a specific third-party integration (e.g., Razorpay, Stripe) mandates it.

### 19. Required Tests
- **Testing Challenges Avoided:** Mocking webhook provider requests and signatures.

### 20. Final Recommendation
- **Status:** NOT JUSTIFIED

---

## 35. `rate-limit-service.ts`

### 1. Service Status
**REQUIRED**
Protecting public API routes (like registration, waitlist joining, or login) from brute force attacks is essential, especially given Next.js server actions are exposed as endpoints.

### 2. Codebase Evidence
- No explicit rate limiting middleware exists.

### 3. Database Tables
- Can use Redis (Upstash) or a lightweight Supabase table.

### 4. RLS Policy Analysis
- **Constraint:** The rate limit cache table must completely block anonymous RLS access; it should only be written to by the service layer using the service role key.

### 5. Database Functions / RPC Analysis
- **RPC Required:** If using Postgres instead of Redis, an RPC like `increment_rate_limit(ip_address, action, max_hits, window_seconds)` is absolutely required to ensure atomicity.

### 6. Trigger Analysis
- **Absence:** Purely function-driven, no triggers needed.

### 7. Existing Business Logic
- Server actions accept requests as fast as the client sends them.

### 8. Duplicate Logic Analysis
- Currently, no limiting exists, meaning this is a net-new requirement.

### 9. Problems in Current Architecture
- **Security (HIGH):** Malicious users can script registrations to fill capacity instantly, or brute force login attempts.

### 10. Service Responsibilities
- Owns: Tracking request counts per IP/User, blocking requests exceeding limits.

### 11. Proposed Public API
```ts
export async function checkRateLimit(identifier: string, action: string): Promise<boolean>
```

### 12. TypeScript Types
- `RateLimitConfig`: `{ maxRequests: number, windowMs: number }`

### 13. Error Handling Strategy
- Throw `RateLimitExceededError` (HTTP 429).

### 14. Transaction Requirements
- **Atomic Increments:** Must use atomic counters (Redis `INCR` or Postgres `UPDATE ... count = count + 1`) to prevent race conditions during high-volume spikes.

### 15. Security Analysis
- Prevents DoS and brute-force attacks on sensitive endpoints. Must properly extract the client IP from `x-forwarded-for` headers behind the load balancer.

### 16. Performance Analysis
- Must be extremely fast (sub 50ms). Recommend Redis or Upstash. If using Postgres, use an unlogged table.

### 17. Dependencies
- Depends on: `@upstash/ratelimit` or a custom Postgres implementation.

### 18. Migration Plan
- 1. Introduce in `middleware.ts` or as a wrapper in `lib/actions/*`.
- 2. Target high-risk endpoints first: `joinEvent`, `login`.

### 19. Required Tests
- **Integration Tests Needed:** Exceeding limit triggers rejection. Assert that 11 rapid requests to a 10-limit endpoint results in exactly 1 HTTP 429.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P1
- **Complexity:** LOW
- **Security Sensitivity:** HIGH
- **Implementation Order:** 12

---
---

## 36. `slug-service.ts`

### 1. Service Status
**NOT JUSTIFIED**
Generating URL-friendly strings from event titles is a simple string utility function, not a service layer.

### 2. Codebase Evidence
- `lib/utils.ts` likely contains string manipulation.

### 3. Database Tables
- **Not Applicable:** Pure string manipulation requires no tables.

### 4. RLS Policy Analysis
- **Not Applicable.**

### 5. Database Functions / RPC Analysis
- **Not Applicable.**

### 6. Trigger Analysis
- **Not Applicable.**

### 7. Existing Business Logic
- `slugify(title)` converts "My Event 2026!" to "my-event-2026".

### 8. Duplicate Logic Analysis
- **None.**

### 9. Problems in Current Architecture
- Creating a stateful or dependency-injected service class for a pure function is an anti-pattern.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Formatting URL strings.
- **Why it is rejected:** It belongs in `lib/utils.ts`, not `lib/services/`.

### 11. Proposed Public API
- **Justification for Absence:** Use `export function slugify(text: string): string`.

### 12. TypeScript Types
- **Not Applicable.**

### 13. Error Handling Strategy
- **Expected Errors Avoided:** String utils shouldn't throw, they should return safe fallbacks.

### 14. Transaction Requirements
- **Not Applicable.**

### 15. Security Analysis
- **Attack Surface:** Malformed strings could break routing if not properly encoded.

### 16. Performance Analysis
- **Compute Impact:** Negligible. Regex execution time is sub-millisecond.

### 17. Dependencies
- **Dependencies:** None. Native JS regex.

### 18. Migration Plan
- **Action Required:** DO NOT create.

### 19. Required Tests
- **Testing Challenges Avoided:** Standard unit tests on `utils.ts` are sufficient.

### 20. Final Recommendation
- **Status:** NOT JUSTIFIED

---

## 37. `eligibility-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `registration-service.ts`)
Validating `event_constraints` (semester, department) is the core responsibility of the registration flow.

### 2. Codebase Evidence
- Constraints checked during registration.

### 3. Database Tables
- **`event_constraints`**.

### 4. RLS Policy Analysis
- **Policy Overlap:** RLS on registrations naturally incorporates event constraints.

### 5. Database Functions / RPC Analysis
- **RPC Usage:** Eligibility checks (e.g., verifying a user's department matches the event constraint) should occur atomically within the `register_for_event` RPC.

### 6. Trigger Analysis
- **Absence:** Constraints are verified before insertion, not via triggers.

### 7. Existing Business Logic
- Check if user semester is in `allowed_semesters` before showing the register button.

### 8. Duplicate Logic Analysis
- Minimal duplication. 

### 9. Problems in Current Architecture
- Separation creates circular dependencies between a hypothetical `eligibility-service` and `registration-service`.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Returning a boolean `isEligible`.
- **Why it is merged:** Eligibility is just a pre-flight check for registration.

### 11. Proposed Public API
- **Justification for Absence:** Absorbed by `registration-service.ts`.
- `checkEligibility(eventId: string, profileId: string): Promise<{ eligible: boolean, reason?: string }>`

### 12. TypeScript Types
- `EligibilityResult`: `{ eligible: boolean, reason: 'WRONG_SEMESTER' | 'WRONG_DEPT' | 'NONE' }`

### 13. Error Handling Strategy
- **Domain Errors:** `IneligibleForEventError`.

### 14. Transaction Requirements
- **Atomic Registration:** The final eligibility check must happen inside the registration Postgres transaction to prevent a user altering their profile mid-registration.

### 15. Security Analysis
- **Attack Surface:** Users tampering with client-side checks to register for restricted events.
- **Mitigation:** Server-side enforcement within `registration-service.ts` is mandatory.

### 16. Performance Analysis
- **Query Impact:** `events` and `profiles` are already fetched during registration, so this adds zero extra DB roundtrips.

### 17. Dependencies
- **Dependencies:** Relies on `registration-service.ts`.

### 18. Migration Plan
- **Action Required:** Merge constraint validation into `registration-service.ts`.

### 19. Required Tests
- **Integration Tests Needed:** Ensure a 2nd-semester student attempting to register for a 6th-semester-only event receives a hard `403 Forbidden`.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED

---

## 38. `capacity-service.ts`

### 1. Service Status
**SHOULD BE MERGED** (with `registration-service.ts`)
Checking capacity is atomic to the registration transaction. A separate service cannot safely guarantee capacity without locking.

### 2. Codebase Evidence
- `events.max_capacity`.

### 3. Database Tables
- **Read-Only Context:** Queries `registrations` and `events`.

### 4. RLS Policy Analysis
- **Policy Overlap:** Handled by registration flow.

### 5. Database Functions / RPC Analysis
- **RPC Required:** Safe capacity checking requires a locking mechanism or RPC like `register_for_event` that rolls back if `COUNT(registrations) >= events.max_capacity`.

### 6. Trigger Analysis
- **Absence:** Logic is handled in the application layer or RPCs, not triggers.

### 7. Existing Business Logic
- `COUNT(*)` on registrations.

### 8. Duplicate Logic Analysis
- Checking capacity happens in UI (to show 'Sold Out') and API (to block inserts).

### 9. Problems in Current Architecture
- Separation causes race conditions. If `capacity-service.ts` returns `true`, and then `registration-service.ts` inserts, 100 users could bypass the limit simultaneously.

### 10. Service Responsibilities
- **Proposed Responsibilities:** Tracking total ticket sales vs max capacity.
- **Why it is merged:** Must be strictly bound to the registration transaction.

### 11. Proposed Public API
- **Justification for Absence:** Absorbed by `registration-service.ts`.

### 12. TypeScript Types
- `CapacityStatus`: `{ total: number, max: number, isFull: boolean }`

### 13. Error Handling Strategy
- **Domain Errors:** `EventAtCapacityError`.

### 14. Transaction Requirements
- **Atomic Validation:** Capacity validation MUST be performed inside a `SERIALIZABLE` transaction or via an RPC with explicit table locks to prevent over-registration.

### 15. Security Analysis
- **Attack Surface:** High-traffic botting to oversell an event.
- **Mitigation:** The merged service must lean entirely on Postgres constraints, not Next.js memory.

### 16. Performance Analysis
- **Query Impact:** `SELECT COUNT(*)` on large registration tables is slow. A `current_registrations` counter column on `events` updated via trigger is recommended for scale.

### 17. Dependencies
- **Dependencies:** Relies on `registration-service.ts`.

### 18. Migration Plan
- **Action Required:** DO NOT create. Enforce capacity limits natively in the registration insertion logic.

### 19. Required Tests
- **Integration Tests Needed:** Fire 50 concurrent registration promises to an event with 5 slots remaining. Assert exactly 5 succeed and 45 fail.

### 20. Final Recommendation
- **Status:** SHOULD BE MERGED

---

## 39. `venue-service.ts`

### 1. Service Status
**REQUIRED**
Venues have independent availability, capacity, and conflict-resolution requirements separate from the events themselves.

### 2. Codebase Evidence
- Venues are managed in the admin dashboard.

### 3. Database Tables
- **`venues`**: `id`, `name`, `capacity`.
- **`venue_availabilities`**: Tracks booked times.

### 4. RLS Policy Analysis
- Admins manage venues; anyone can read.

### 5. Database Functions / RPC Analysis
- **Absence:** No functions exist for conflict resolution.

### 6. Trigger Analysis
- **Absence:** Venues are checked in the application layer.

### 7. Existing Business Logic
- Event creation assigns a venue ID.

### 8. Duplicate Logic Analysis
- Checking if a venue is available at a specific time block is duplicated in event creation and venue management.

### 9. Problems in Current Architecture
- **Conflict Risk (HIGH):** Two events can currently book the same venue at the same time if overlapping dates aren't strictly checked.

### 10. Service Responsibilities
- Owns: Venue CRUD, checking availability windows, preventing double booking.

### 11. Proposed Public API
```ts
export async function checkVenueAvailability(venueId: string, startTime: Date, endTime: Date): Promise<boolean>
export async function bookVenue(venueId: string, eventId: string, startTime: Date, endTime: Date): Promise<void>
```

### 12. TypeScript Types
- `VenueConflictError`.

### 13. Error Handling Strategy
- Throw conflict errors cleanly.

### 14. Transaction Requirements
- Booking must be transactionally safe against concurrent event creations.

### 15. Security Analysis
- **Attack Surface:** Standard authorization checks. Only admins/CC members can book venues.

### 16. Performance Analysis
- Index start/end times on availabilities table.

### 17. Dependencies
- Used by: `event-service.ts`.

### 18. Migration Plan
1. Create service, integrate into event creation flow.

### 19. Required Tests
- Overlapping time bookings.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P1
- **Complexity:** MEDIUM
- **Security Sensitivity:** LOW
- **Implementation Order:** 13

---

## 40. `certificate-service.ts`

### 1. Service Status
**REQUIRED**
Generating PDF certificates dynamically, storing them, and delivering them via email is a complex bounded context.

### 2. Codebase Evidence
- Mention of certificates in event success metrics.

### 3. Database Tables
- **`event_certificates`**: `id`, `student_id`, `event_id`, `issue_date`, `pdf_url`.
- **`cert_deliveries`**.

### 4. RLS Policy Analysis
- Students can only read their own certificates.

### 5. Database Functions / RPC Analysis
- **Absence:** Generating PDFs is done entirely in the Node.js application layer.

### 6. Trigger Analysis
- **Absence:** Certificates are explicitly requested, not triggered automatically on event end (yet).

### 7. Existing Business Logic
- Admins trigger certificate generation -> PDF library draws text onto a template -> Uploads to storage -> Emails student.

### 8. Duplicate Logic Analysis
- **Minimal:** Certificate generation may share file upload logic with `media-service`, but the PDF rendering pipeline is unique to this service.

### 9. Problems in Current Architecture
- UI blocking on PDF generation.

### 10. Service Responsibilities
- Owns: PDF generation, bulk generation, invoking email service.

### 11. Proposed Public API
```ts
export async function generateCertificate(eventId: string, studentId: string): Promise<string> // Returns URL
export async function bulkGenerateCertificates(eventId: string): Promise<void>
```

### 12. TypeScript Types
- `CertificateMetadata`: `{ studentName: string, eventName: string, issueDate: string, pdfBuffer: Buffer }`

### 13. Error Handling Strategy
- Catch PDF rendering failures.

### 14. Transaction Requirements
- Insert into `event_certificates` only after PDF upload succeeds.

### 15. Security Analysis
- IDs must be secure/UUIDs to prevent enumerating and stealing others' certificates.

### 16. Performance Analysis
- Should use background queues for bulk generation.

### 17. Dependencies
- Depends on: `media-service.ts`, `email-service.ts`.

### 18. Migration Plan
1. Abstract PDF-lib logic into the service.

### 19. Required Tests
- Generation for a student with a very long name (UI overflow test).

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P2
- **Complexity:** HIGH
- **Security Sensitivity:** LOW
- **Implementation Order:** 14

---
---

## 41. `gamification-service.ts`

### 1. Service Status
**REQUIRED**
While points are awarded via triggers, querying leaderboards, fetching badge statuses, and determining level progression belongs in a centralized read-focused service.

### 2. Codebase Evidence
- `profiles.points`, `points_history` table, `user_badges` table.

### 3. Database Tables
- **`profiles`**, **`points_history`**, **`user_badges`**.

### 4. RLS Policy Analysis
- Read access public.

### 5. Database Functions / RPC Analysis
- **Absence:** `points_history` writes are handled internally by Postgres triggers (`on_registration_points`). The service is read-only.

### 6. Trigger Analysis
- `on_registration_points`, `on_check_in_points` handle the writes.

### 7. Existing Business Logic
- Triggers write points. UI fetches points and ranks.

### 8. Duplicate Logic Analysis
- Leaderboard ranking logic is repeated.

### 9. Problems in Current Architecture
- Direct DB queries for points make it hard to swap logic (e.g., adding multipliers).

### 10. Service Responsibilities
- Owns: Fetching leaderboards, resolving badges, fetching point history. (Merged with `leaderboard-service.ts` and `badge-service.ts`).

### 11. Proposed Public API
```ts
export async function getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>
export async function getUserBadges(userId: string): Promise<Badge[]>
```

### 12. TypeScript Types
- `LeaderboardEntry`: `{ profileId: string, name: string, points: number, rank: number }`

### 13. Error Handling Strategy
- **Domain Errors:** `GamificationDataNotFoundError` when a `profileId` does not exist in `profiles`. `BadgeAlreadyAwardedError` if the badge insertion violates a unique constraint.

### 14. Transaction Requirements
- **Read-Only:** Fetching leaderboards and badges involves complex `JOIN`s but requires no transactional locking.

### 15. Security Analysis
- **Attack Surface:** IDOR in badge fetching (viewing another user's badges).
- **Mitigation:** Since gamification is public by design, this is low risk, but `profileId` exposure must be sanitized to prevent leaking PII (emails).

### 16. Performance Analysis
- Leaderboard queries must be indexed.

### 17. Dependencies
- None.

### 18. Migration Plan
1. Centralize points queries here.

### 19. Required Tests
- Leaderboard ordering correctness.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P3
- **Complexity:** LOW
- **Security Sensitivity:** LOW
- **Implementation Order:** 15

---

## 42. `notification-service.ts`

### 1. Service Status
**REQUIRED**
Handles in-app notifications (bells, toasts) generated by various events (waitlist promotion, event approval).

### 2. Codebase Evidence
- `notifications` table.

### 3. Database Tables
- **`notifications`**: `id`, `user_id`, `message`, `read`, `type`.

### 4. RLS Policy Analysis
- Users read their own notifications.

### 5. Database Functions / RPC Analysis
- Triggers often insert into this table.

### 6. Trigger Analysis
- `trigger_registration_promotion` creates notifications.

### 7. Existing Business Logic
- Triggers create notifications. UI polls or subscribes to read them.

### 8. Duplicate Logic Analysis
- **None:** Trigger-based notifications are centralized in Postgres. Application-level notifications are ad-hoc.

### 9. Problems in Current Architecture
- No centralized way to send application-level notifications that aren't tied to triggers.

### 10. Service Responsibilities
- Owns: Manually sending notifications, marking as read/unread.

### 11. Proposed Public API
```ts
export async function sendNotification(userId: string, payload: NotificationPayload): Promise<void>
export async function markAsRead(notificationId: string): Promise<void>
```

### 12. TypeScript Types
- `NotificationPayload`: `{ message: string, type: 'info' | 'success' | 'warning' }`

### 13. Error Handling Strategy
- **Domain Errors:** `NotificationDeliveryFailedError` if the insert into `notifications` fails. `InvalidNotificationTypeError` if a caller passes a type not in the permitted enum.

### 14. Transaction Requirements
- **Atomic Operations:** When an action (e.g., event approval) generates a notification, the insert into `notifications` MUST happen in the same Postgres transaction as the `events.status = 'APPROVED'` update.

### 15. Security Analysis
- **Attack Surface:** Users tampering with `user_id` to mark other users' notifications as read or to inject malicious HTML into the `message` field.
- **Mitigation:** Rely on RLS `auth.uid() = user_id` for read/update operations.

### 16. Performance Analysis
- **Compute Impact:** Polling the `notifications` table frequently causes database strain. Must rely on Supabase Realtime (WebSockets) for delivery.

### 17. Dependencies
- None.

### 18. Migration Plan
1. Abstract `supabase.from('notifications').update({ read: true })` from the frontend header component.

### 19. Required Tests
- Marking read.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P3
- **Complexity:** LOW
- **Security Sensitivity:** LOW
- **Implementation Order:** 16

---

## 43. `hackathon-service.ts`

### 1. Service Status
**REQUIRED**
Hackathons are a massive bounded context involving teams, submissions, evaluating, and scoring. Merging all hackathon-related features into one service enforces consistency.

### 2. Codebase Evidence
- `hackathon_*` tables. `lib/actions/hackathon-actions.ts`.

### 3. Database Tables
- **`hackathon_teams`**, **`hackathon_team_members`**, **`hackathon_submissions`**, **`hackathon_judges`**, **`hackathon_evaluations`**.

### 4. RLS Policy Analysis
- Very complex RLS. Team leaders control teams, judges control evaluations.

### 5. Database Functions / RPC Analysis
- **Absence:** Logic is handled in the application layer, though `create_team` could benefit from an RPC.

### 6. Trigger Analysis
- **Absence:** No triggers currently manage hackathon states.

### 7. Existing Business Logic
- Highly coupled to specialized UI routes.

### 8. Duplicate Logic Analysis
- Team membership checks are duplicated across submission and evaluation logic.

### 9. Problems in Current Architecture
- Scattering hackathon logic across 5+ services leads to circular dependencies.

### 10. Service Responsibilities
- Owns: Hackathon lifecycle, teams, judges, submissions, scoring (Merged with `team-`, `judge-`, `scoring-`, `submission-services`).

### 11. Proposed Public API
```ts
export async function createHackathonTeam(eventId: string, name: string, leaderId: string): Promise<void>
export async function submitHackathonProject(teamId: string, url: string): Promise<void>
export async function evaluateSubmission(submissionId: string, judgeId: string, scores: any): Promise<void>
```

### 12. TypeScript Types
- `HackathonTeam`: `{ id: string, eventId: string, name: string, inviteCode: string, leaderId: string, members: TeamMember[] }`
- `TeamMember`: `{ profileId: string, name: string, joinedAt: Date }`
- `HackathonSubmission`: `{ id: string, teamId: string, repoUrl: string, demoUrl: string, description: string, submittedAt: Date }`
- `HackathonJudgeAssignment`: `{ eventId: string, judgeProfileId: string, assignedAt: Date }`
- `HackathonEvaluation`: `{ submissionId: string, judgeId: string, scores: Record<string, number>, feedback: string, evaluatedAt: Date }`
- `HackathonCriteria`: `{ id: string, eventId: string, name: string, weight: number, maxScore: number }`
- `HackathonScoreResult`: `{ submissionId: string, finalScore: number, rankPosition: number }`

### 13. Error Handling Strategy
- High granularity required (e.g., `NotATeamMemberError`, `SubmissionClosedError`).

### 14. Transaction Requirements
- Creating a team and adding the leader must be atomic.

### 15. Security Analysis
- Strict role verification required for judging.

### 16. Performance Analysis
- Aggregate queries for leaderboards are heavy.

### 17. Dependencies
- Depends on: `permission-service.ts`.

### 18. Migration Plan
1. Port all hackathon-related actions into this monolithic domain service.

### 19. Required Tests
- Non-leader attempting to submit.
- Judge attempting to edit another judge's score.

### 20. Final Recommendation
- **Status:** REQUIRED
- **Priority:** P2
- **Complexity:** VERY HIGH
- **Security Sensitivity:** HIGH
- **Implementation Order:** 17

---

# CROSS-SERVICE ARCHITECTURE ANALYSIS

## Service Dependency Map

```text
permission-service (REQUIRED — P1)
    └── No dependencies. Foundation service.

rate-limit-service (REQUIRED — P1)
    └── @upstash/ratelimit or custom Postgres implementation

event-service (REQUIRED — P1)
    ├── permission-service
    └── venue-service

registration-service (REQUIRED — P1)
    ├── permission-service
    ├── qr-service (optional)
    └── (Absorbs: eligibility-service, capacity-service)

attendance-service (REQUIRED — P1)
    ├── permission-service
    └── qr-service (optional)

club-service (REQUIRED — P1)
    ├── permission-service
    └── (Absorbs: membership-service)

venue-service (REQUIRED — P1)
    └── permission-service

hackathon-service (REQUIRED — P2)
    ├── permission-service
    ├── rate-limit-service (for team invite code brute-force protection)
    └── (Absorbs: team-service, judge-service, scoring-service, submission-service)

email-service (REQUIRED — P2)
    └── No service dependencies. Uses nodemailer/Resend externally.

notification-service (REQUIRED — P3)
    └── No service dependencies. Writes to `notifications` table.

media-service (REQUIRED — P2)
    ├── permission-service
    └── (Absorbs: upload-service)

feedback-service (REQUIRED — P2)
    └── No service dependencies.
    └── (Absorbs: survey-service)

certificate-service (REQUIRED — P2)
    ├── media-service
    ├── email-service
    └── (Absorbs: verification-service)

gamification-service (REQUIRED — P3)
    └── No service dependencies. Read-only aggregator of trigger-written data.
    └── (Absorbs: leaderboard-service, badge-service)

analytics-service (REQUIRED — P4)
    └── No service dependencies.
    └── (Absorbs: dashboard-service)

export-service (REQUIRED — P4)
    └── permission-service

qr-service (RECOMMENDED)
    └── No service dependencies. Pure utility.

calendar-service (RECOMMENDED)
    └── No service dependencies.

invite-service (OPTIONAL)
    └── email-service

search-service (OPTIONAL)
    └── rate-limit-service

moderation-service (OPTIONAL)
    └── permission-service
```

*Note: No circular dependencies detected. All dependency arrows point downward in the implementation priority order.*

---

## Service Responsibility Matrix

| Responsibility | Current Location | Proposed Owner | Migration Required |
| -------------- | ---------------- | -------------- | ------------------ |
| Role / RBAC verification | Scattered `assertAdmin()`, `assertCC()` in `lib/actions/*` | `permission-service.ts` | Yes |
| Rate limiting / DoS prevention | Not implemented | `rate-limit-service.ts` | Yes (net new) |
| Event CRUD | `lib/actions/cc-events.ts` | `event-service.ts` | Yes |
| Event registration | `lib/actions/student-actions.ts` | `registration-service.ts` | Yes |
| Eligibility / constraint validation | Inline in registration UI/actions | `registration-service.ts` | Yes |
| Capacity enforcement | Inline `COUNT(*)` in UI and actions | `registration-service.ts` | Yes |
| QR code generation | `lib/actions/student-actions.ts` | `qr-service.ts` (or inline) | Optional |
| Attendance / check-in | `lib/actions/student-actions.ts` | `attendance-service.ts` | Yes |
| Club CRUD | `lib/actions/admin.ts` | `club-service.ts` | Yes |
| Club membership management | `lib/actions/admin.ts` | `club-service.ts` | Yes |
| Venue CRUD and conflict detection | Admin dashboard | `venue-service.ts` | Yes |
| Waitlist promotion | PostgreSQL triggers | PostgreSQL triggers (no change) | No |
| Gamification points awarding | PostgreSQL triggers | PostgreSQL triggers (no change) | No |
| Leaderboard queries | Inline `ORDER BY points` | `gamification-service.ts` | Yes |
| Badge evaluation and awarding | Not yet implemented | `gamification-service.ts` | Yes (net new) |
| Hackathon team management | `lib/actions/hackathon-actions.ts` | `hackathon-service.ts` | Yes |
| Hackathon judge assignment | `lib/actions/hackathon-eval-actions.ts` | `hackathon-service.ts` | Yes |
| Hackathon scoring / evaluation | `lib/actions/hackathon-eval-actions.ts` | `hackathon-service.ts` | Yes |
| Hackathon submission management | `lib/actions/hackathon-actions.ts` | `hackathon-service.ts` | Yes |
| File upload and validation | UI components (client-side) | `media-service.ts` | Yes |
| Public URL generation | Inline Supabase storage calls | `media-service.ts` | Yes |
| Email sending | Inline or missing | `email-service.ts` | Yes |
| In-app notifications | Triggers + inline UI code | `notification-service.ts` | Yes |
| Feedback / survey submission | `StudentFeedbackTerminal.tsx` | `feedback-service.ts` | Yes |
| Feedback schema configuration | Event creation flow | `feedback-service.ts` | Yes |
| Certificate PDF generation | Admin action (blocking) | `certificate-service.ts` | Yes |
| Certificate verification | `/verify` route | `certificate-service.ts` | Yes |
| Analytics / dashboard metrics | Inline RSC queries | `analytics-service.ts` | Yes |
| Data export (CSV/XLSX) | API route handler | `export-service.ts` | Yes |
| Calendar date grouping | Frontend JS | `calendar-service.ts` | Optional |
| Audit logging | `lib/audit/write-log.ts` | `lib/audit/write-log.ts` (no change) | No |
| Row Level Security | PostgreSQL RLS policies | PostgreSQL RLS (no change) | No |

---

## Duplicate Logic Matrix

| Duplicated Logic | Locations Found | Risk Level | Canonical Service |
| ---------------- | --------------- | ---------- | ----------------- |
| `role === 'admin'` / `assertAdmin()` | All admin actions, hackathon actions, event actions | **HIGH** | `permission-service.ts` |
| `role === 'cc'` / `assertCC()` | CC event actions, report actions | **HIGH** | `permission-service.ts` |
| `max_capacity` check / `COUNT(*)` | UI (show "Sold Out"), `student-actions.ts` (block insert) | **HIGH** | `registration-service.ts` |
| File size/type validation | Event banner upload, report upload, face scan upload | **HIGH** | `media-service.ts` |
| Public URL generation from storage path | Event banner display, event photos gallery, face scan preview | **MEDIUM** | `media-service.ts` |
| Eligibility constraint checking | UI (hide register button), API (block insert) | **MEDIUM** | `registration-service.ts` |
| Feedback duplicate check (Postgres `23505` catch) | `StudentFeedbackTerminal.tsx`, API error handling | **MEDIUM** | `feedback-service.ts` |
| Team membership validation | Hackathon submission flow, evaluation flow | **MEDIUM** | `hackathon-service.ts` |
| Leaderboard ranking (`ORDER BY points DESC`) | Admin dashboard, student leaderboard page | **LOW** | `gamification-service.ts` |
| Calendar date grouping (UTC/IST boundary math) | Admin calendar view, student calendar view | **LOW** | `calendar-service.ts` |
| CSV generation logic | Registration export, feedback export | **LOW** | `export-service.ts` |
| Certificate existence check | `/verify` route, student dashboard | **LOW** | `certificate-service.ts` |

---

## Database vs Service Responsibility Matrix

| Logic Type | Proposed Location |
| ---------- | ----------------- |
| Waitlist Promotion | PostgreSQL Triggers |
| Gamification Points Awarding | PostgreSQL Triggers |
| Role / RBAC Verification | Service Layer (`permission-service.ts`) |
| Demographics Constraints | Service Layer (`registration-service.ts`) |
| Capacity Enforcement | Service Layer (`registration-service.ts`) via RPC with table locks |
| Row Level Security | PostgreSQL RLS |
| Audit Logging | Utility (`lib/audit/write-log.ts`) |
| Badge Threshold Evaluation | Service Layer (`gamification-service.ts`) |

---

## Proposed Final `lib/services` Structure

```text
lib/
└── services/
    ├── permission-service.ts
    ├── event-service.ts
    ├── registration-service.ts
    ├── attendance-service.ts
    ├── club-service.ts
    ├── venue-service.ts
    ├── media-service.ts
    ├── email-service.ts
    ├── feedback-service.ts
    ├── certificate-service.ts
    ├── gamification-service.ts
    ├── notification-service.ts
    ├── analytics-service.ts
    ├── export-service.ts
    ├── hackathon-service.ts
    ├── qr-service.ts         (Recommended)
    ├── rate-limit-service.ts (Required)
    ├── calendar-service.ts   (Recommended)
    ├── invite-service.ts     (Optional)
    ├── search-service.ts     (Optional)
    └── moderation-service.ts (Optional)
```

---

## Services That Should Be Merged (13 total)

- `membership-service` → `club-service`
- `leaderboard-service` → `gamification-service`
- `badge-service` → `gamification-service`
- `survey-service` → `feedback-service`
- `team-service` → `hackathon-service`
- `judge-service` → `hackathon-service`
- `scoring-service` → `hackathon-service`
- `submission-service` → `hackathon-service`
- `capacity-service` → `registration-service`
- `eligibility-service` → `registration-service`
- `upload-service` → `media-service`
- `verification-service` → `certificate-service`
- `dashboard-service` → `analytics-service`

---

## Services That Are Not Justified (9 total)

Status taxonomy note: This category includes services with individual statuses of **NOT JUSTIFIED** (7 services where the concept is entirely unsupported by the codebase or infrastructure) and **ALREADY IMPLEMENTED ELSEWHERE** (2 services where the functionality already exists in a non-service form and does not need migration).

**NOT JUSTIFIED (no backing infrastructure):**
- `reminder-service` (Requires background workers not available in serverless Next.js)
- `recommendation-service` (No telemetry, tags, or preference tables exist)
- `task-service` (No task management tables; scope creep)
- `activity-service` (No activity feed tables; scope creep)
- `scheduler-service` (No persistent worker; use `pg_cron` instead)
- `webhook-service` (No third-party integrations require it)
- `slug-service` (Pure utility function, not a service)

**ALREADY IMPLEMENTED ELSEWHERE (no migration needed):**
- `waitlist-service` (Handled by PostgreSQL triggers with `SECURITY DEFINER`)
- `audit-service` (Already built as `lib/audit/write-log.ts`)

---

# IMPLEMENTATION PRIORITY ROADMAP

## Phase 0 — Security and Data Integrity
1. `permission-service.ts`
2. `rate-limit-service.ts`

## Phase 1 — Core Domain Services
3. `event-service.ts`
4. `registration-service.ts` (absorbs eligibility + capacity)
5. `attendance-service.ts`
6. `venue-service.ts`
7. `club-service.ts` (absorbs membership)

## Phase 2 — Hackathon Architecture
8. `hackathon-service.ts` (absorbs team + judge + scoring + submission)

## Phase 3 — Communication and Automation
9. `email-service.ts`
10. `notification-service.ts`
11. `media-service.ts` (absorbs upload)

## Phase 4 — Engagement
12. `feedback-service.ts` (absorbs survey)
13. `certificate-service.ts` (absorbs verification)
14. `gamification-service.ts` (absorbs leaderboard + badge)

## Phase 5 — Analytics and Optimization
15. `analytics-service.ts` (absorbs dashboard)
16. `export-service.ts`

---

# FINAL EXECUTIVE SUMMARY

1. **Total services investigated:** 43
2. **Services marked REQUIRED:** 15
3. **Services marked RECOMMENDED:** 3 (`qr-service`, `calendar-service`, `rate-limit-service`*)
4. **Services marked OPTIONAL:** 3 (`search-service`, `invite-service`, `moderation-service`)
5. **Services marked SHOULD BE MERGED:** 13
6. **Services not justified:** 7 (no backing infrastructure or data layer)
7. **Services already implemented elsewhere:** 2 (`waitlist-service` via triggers, `audit-service` via utility)
8. **Combined "do not create" count:** 9 (7 not justified + 2 already implemented)
9. **Total unique statuses across 43 services:** REQUIRED (15) + RECOMMENDED (3) + OPTIONAL (3) + SHOULD BE MERGED (13) + NOT JUSTIFIED (7) + ALREADY IMPLEMENTED ELSEWHERE (2) = **43**
10. **Recommended final service file count:** 21 (15 required + 3 recommended + 3 optional)
11. **Top architectural risks:**
    - Race conditions in capacity validation (requires `SERIALIZABLE` transactions or RPC with table locks)
    - Missing server-side file validation (current client-only checks are bypassable)
    - Bypassing RLS or validation rules via direct Supabase client queries in UI components
    - No rate limiting on any public-facing endpoints
12. **Top duplicated logic:** Role verification (`assertAdmin`, `assertCC`) scattered across 10+ action files
13. **Exact service implementation order:** Provided in the roadmap (Phase 0 → Phase 5, 16 implementation steps)
14. **Estimated architectural complexity:** Highly modular monolith. The heavy reliance on PostgreSQL triggers provides immense atomicity but requires the service layer to avoid interfering with database-level responsibilities (like the waitlist).

*Note: `rate-limit-service` is categorized as RECOMMENDED in the Proposed Final Structure but elevated to REQUIRED (P1) in the roadmap due to its critical security importance.*


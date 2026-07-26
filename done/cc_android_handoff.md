# Club Coordinator (CC) Android App — Complete Technical Handoff

This document provides a comprehensive technical guide and architectural handoff for building the **Club Coordinator (CC) mobile application** (or integrating CC capabilities into the existing Android codebase). It details the database interactions, business logic constraints, real-time workflows, and Kotlin translation of the web client server actions.

---

## 1. Supabase Connection

Similar to the PR app, initialize the Supabase client in your Application class or Dependency Injection module:

```kotlin
val supabase = createSupabaseClient(
    supabaseUrl = "YOUR_SUPABASE_PROJECT_URL",
    supabaseKey = "YOUR_SUPABASE_ANON_KEY"
) {
    install(Postgrest)
    install(Auth)
    install(Realtime)
}
```

---

## 2. Database Schema (Only Tables You Need)

### 2.1 `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `full_name` | `text` | |
| `usn` | `text` UNIQUE | |
| `department` | `text` | e.g., "CSE", "ISE" |
| `role` | `enum user_role` | Values: `cc` (for Club Coordinator), `pr`, `teacher`, `hod`, `student`, `manager`, `admin`, `deleted` |

**RLS**: SELECT open to everyone (`true`).

### 2.2 `events`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | Created-by authentication code |
| `title` | `text` | |
| `description` | `text` | Detailed pitch / description |
| `club_name` | `text` | |
| `location` | `text` | Venue of the event |
| `event_date` | `timestamptz` | |
| `registration_deadline` | `timestamptz` | Must be strictly before `event_date` |
| `max_capacity` | `integer` nullable | Max limit of attendees, `null` means unlimited (`∞`) |
| `banner_url` | `text` | Mandatory visual branding / poster image URL |
| `created_by` | `uuid` FK→profiles | The CC who designed the event |
| `approval_status` | `enum event_approval_status` | `draft`, `pending_pr`, `pending_teacher`, `pending_hod`, `approved`, `rejected` |
| `feedback_open` | `boolean` | default `false` (CC controls via toggle after approval) |
| `feedback_config` | `jsonb` | Survey questions array (must have $\ge 3$ questions) |
| `targeted_department` | `text` nullable | Target department name |
| `rejection_data` | `jsonb` | Revision remarks from staff: list of `{ field: String, reason: String }` |

**RLS**: INSERT/UPDATE allowed for `cc` role. CCs can modify events where `created_by = auth.uid()`.

### 2.3 `event_constraints`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `event_id` | `text` FK→events | |
| `allowed_semesters` | `int[]` nullable | Array of allowed semesters (e.g. `[1, 2, 3]`), empty or null means all |
| `allowed_years` | `int[]` nullable | Array of allowed years (e.g. `[1, 2]`), empty or null means all |
| `allowed_departments` | `text[]` nullable | Set during draft creation |

**RLS**: SELECT, INSERT, UPDATE, DELETE allowed for CCs who own the associated event.

### 2.4 `reports`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `event_id` | `text` FK→events | Unique constraint |
| `content` | `jsonb` | Post-event activity data: `{ summary: String, outcomes: String[], photos: String[] }` |
| `status` | `text` | `draft` or `pending_pr` (for publicity audit approval) |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | default `now()` |

**RLS**: SELECT allowed for authorized staff/CC owners. INSERT/UPDATE allowed if `events.created_by = auth.uid()`.

### 2.5 `conversations` & `conversation_members`
| Column | Type | Notes |
|--------|------|-------|
| `conversations.id` | `uuid` PK | |
| `conversations.type` | `text` | `'dm'` or `'group'` |
| `conversations.status` | `text` | `'pending'` or `'active'` |
| `conversation_members.user_id` | `uuid` FK→profiles | |
| `conversation_members.invite_status`| `text` | `'pending'`, `'accepted'`, or `'declined'` |

### 2.6 `messages`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `conversation_id` | `uuid` FK→conversations | |
| `sender_id` | `uuid` FK→profiles | |
| `body` | `text` | |
| `is_deleted` | `boolean` | default `false` |
| `created_at` | `timestamptz` | default `now()` |

---

## 3. Core Business & Validation Rules

Before sending data to Supabase, the CC Android application **MUST** enforce the following validation pipeline:

### 3.1 Survey Design Rule (At least 3 questions)
Every event must define a survey questionnaire for gathering post-event interest/feedback.
*   **Validation**: The `feedback_config` list MUST have **at least 3 questions** configured.

### 3.2 Time & Deadline Rule
*   **Validation**: The Registration Deadline must be strictly **before** the Event Date/Time.

### 3.3 Venue Conflict Check (±4 Hours)
To prevent logistics failures, the application must query the server to check if another approved event is occupying the same venue within a 4-hour window:
$$[EventTime - 4\text{ hours}, \ EventTime + 4\text{ hours}]$$

---

## 4. Complete Flow Logic

### 4.1 Login and Role Verification
Authenticate the user via email and password, then assert their role is `cc` (Club Coordinator) or equivalent staff:

```kotlin
// Step 1: Sign in
supabase.auth.signInWith(Email) {
    email = userEmail
    password = userPassword
}

val userId = supabase.auth.currentUserOrNull()?.id ?: return

// Step 2: Query role
val profile = supabase.from("profiles")
    .select { filter { eq("id", userId) } }
    .decodeSingle<Profile>()

if (profile.role != "cc") {
    // Flag unauthorized access and sign out
    supabase.auth.signOut()
    showError("Access Denied: Requires Club Coordinator role permissions.")
}
```

### 4.2 Home Screen — Event Pipeline Activity
Fetch and display all events created by the current CC, categorized by their approval status:

```kotlin
suspend fun fetchMyPipelineEvents(userId: String): PipelineData {
    val events = supabase.from("events")
        .select {
            filter { eq("created_by", userId) }
            order("created_at", Order.DESCENDING)
        }
        .decodeList<Event>()
        
    return PipelineData(
        drafts = events.filter { it.approvalStatus == "draft" },
        pending = events.filter { it.approvalStatus in listOf("pending_pr", "pending_teacher", "pending_hod") },
        approved = events.filter { it.approvalStatus == "approved" },
        rejected = events.filter { it.approvalStatus == "rejected" }
    )
}
```

### 4.3 Designing/Inserting a New Event Draft (with Validations)
Implement the creation logic, ensuring the survey constraint and venue conflict check pass first:

```kotlin
suspend fun createEventDraft(
    title: String,
    clubName: String,
    description: String,
    location: String,
    eventDate: String, // ISO 8601
    deadlineDate: String, // ISO 8601
    bannerUrl: String,
    maxCapacity: Int?,
    targetedDept: String?,
    feedbackQuestions: List<FeedbackQuestion>,
    allowedSems: List<Int>,
    allowedYears: List<Int>
): CreateResult {
    // 1. Survey rule check
    if (feedbackQuestions.size < 3) {
        return CreateResult.Error("Policy violation: Define at least 3 feedback questions for the event survey.")
    }

    // 2. Dates chronological check
    val eventInstant = Instant.parse(eventDate)
    val deadlineInstant = Instant.parse(deadlineDate)
    if (deadlineInstant >= eventInstant) {
        return CreateResult.Error("Validation error: Registration deadline must be before the event date.")
    }

    // 3. Venue Conflict Check (±4 hours range)
    val fourHoursInMs = 4 * 60 * 60 * 1000
    val startTime = Instant.fromEpochMilliseconds(eventInstant.toEpochMilliseconds() - fourHoursInMs).toString()
    val endTime = Instant.fromEpochMilliseconds(eventInstant.toEpochMilliseconds() + fourHoursInMs).toString()

    val conflicts = supabase.from("events")
        .select {
            filter {
                eq("location", location)
                eq("approval_status", "approved")
                gte("event_date", startTime)
                lte("event_date", endTime)
            }
        }
        .decodeList<Event>()

    if (conflicts.isNotEmpty()) {
        val firstConflict = conflicts.first()
        return CreateResult.Error(
            "Venue Conflict: '$location' is already booked for '${firstConflict.title}' during this time window."
        )
    }

    // 4. Insert into 'events'
    val newEvent = supabase.from("events").insert(
        EventInsert(
            title = title,
            clubName = clubName,
            description = description,
            location = location,
            eventDate = eventDate,
            registrationDeadline = deadlineDate,
            maxCapacity = maxCapacity,
            bannerUrl = bannerUrl,
            createdBy = currentUserId,
            approvalStatus = "draft",
            targetedDepartment = targetedDept,
            feedbackConfig = feedbackQuestions,
            status = "upcoming"
        )
    ) {
        select(Columns.list("id"))
    }.decodeSingle<IdOnly>()

    // 5. Insert into 'event_constraints'
    supabase.from("event_constraints").insert(
        EventConstraintsInsert(
            eventId = newEvent.id,
            allowedSemesters = allowedSems.ifEmpty { null },
            allowedYears = allowedYears.ifEmpty { null },
            allowedDepartments = targetedDept?.let { listOf(it) }
        )
    )

    return CreateResult.Success(newEvent.id)
}
```

### 4.4 Submitting Event Draft for Faculty Review
Lock editing and hand over the event draft to the faculty approval queue:

```kotlin
suspend fun submitEventForReview(eventId: String): Boolean {
    val response = supabase.from("events")
        .update({
            set("approval_status", "pending_teacher")
        }) {
            filter { eq("id", eventId) }
        }
    return true
}
```

### 4.5 Handing Rejection and Revision Notes
If an event is rejected, the CC can check the requested revisions and fix them. Saving the draft resets the status back to `draft` and clears feedback:

```kotlin
// Retrieve rejection remarks
fun getRejectionRemarks(event: Event): List<RejectionRemark> {
    return event.rejectionData ?: emptyList()
}

// When re-saving draft, update event details and clear rejection list:
suspend fun updateEventDraftAndClearRejection(
    eventId: String,
    updatedEvent: EventUpdate
) {
    supabase.from("events")
        .update({
            set("title", updatedEvent.title)
            set("description", updatedEvent.description)
            set("location", updatedEvent.location)
            set("event_date", updatedEvent.eventDate)
            set("registration_deadline", updatedEvent.registrationDeadline)
            set("banner_url", updatedEvent.bannerUrl)
            set("max_capacity", updatedEvent.maxCapacity)
            set("targeted_department", updatedEvent.targetedDepartment)
            set("feedback_config", updatedEvent.feedbackConfig)
            set("rejection_data", "[]") // Clear previous rejections
            set("approval_status", "draft") // Reset pipeline step
        }) {
            filter { eq("id", eventId) }
        }
}
```

### 4.6 Managing Live Feedback Toggles (Post-Approval)
Once approved and published, the CC has direct authority to turn feedback collection on or off:

```kotlin
suspend fun toggleFeedbackCollection(eventId: String, isEnabled: Boolean): Boolean {
    supabase.from("events")
        .update({
            set("feedback_open", isEnabled)
        }) {
            filter { eq("id", eventId) }
        }
    return true
}
```

### 4.7 Drafting and Submitting Post-Event Activity Reports
Once the event is successfully completed, the Club Coordinator submits an Activity Report containing the executive summary, outcomes achieved, and photo URLs:

```kotlin
suspend fun saveReport(
    eventId: String,
    summary: String,
    outcomes: List<String>,
    photoUrls: List<String>,
    isFinalSubmit: Boolean
): Boolean {
    val reportContent = ReportContent(
        summary = summary,
        outcomes = outcomes.filter { it.isNotBlank() },
        photos = photoUrls.filter { it.isNotBlank() }
    )
    
    val reportStatus = if (isFinalSubmit) "pending_pr" else "draft"

    supabase.from("reports").upsert(
        ReportUpsert(
            eventId = eventId,
            content = reportContent,
            status = reportStatus,
            updatedAt = Clock.System.now().toString()
        )
    ) {
        onConflict = "event_id"
    }
    return true
}
```

### 4.8 Direct Peer DM Requests
Coordinators can easily search and initiate direct text messaging conversations with peers (other CCs, PR officers, teachers, or admins):

```kotlin
// Step 1: Search peer users in the institution
suspend fun searchPeers(query: String, currentUserId: String): List<PeerProfile> {
    return supabase.from("profiles")
        .select(columns = Columns.list("id", "full_name", "usn", "department")) {
            filter {
                neq("id", currentUserId)
                neq("role", "deleted")
                or("full_name.ilike.%$query%,usn.ilike.%$query%")
            }
        }
        .decodeList<PeerProfile>()
}

// Step 2: Send DM invite / Initiate Chat Conversation
suspend fun sendPeerDMInvite(currentUserId: String, peerId: String): String {
    // Create new conversation block
    val conversationId = supabase.from("conversations").insert(
        ConversationInsert(type = "dm", status = "pending", createdBy = currentUserId)
    ) {
        select(Columns.list("id"))
    }.decodeSingle<IdOnly>().id

    // Add members (Sender is automatically accepted; recipient status is pending)
    supabase.from("conversation_members").insert(
        listOf(
            ConversationMemberInsert(conversationId, currentUserId, role = "admin", inviteStatus = "accepted"),
            ConversationMemberInsert(conversationId, peerId, role = "member", inviteStatus = "pending")
        )
    )

    // Notify the recipient peer
    supabase.from("notifications").insert(
        NotificationInsert(
            userId = peerId,
            type = "dm_invite",
            title = "New Message Request",
            body = "A peer wants to establish a DM connection with you.",
            metadata = InviteMetadata(conversationId = conversationId, fromUserId = currentUserId)
        )
    )

    return conversationId
}
```

---

## 5. Data Models (Kotlin)

```kotlin
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Profile(
    val id: String,
    @SerialName("full_name") val fullName: String,
    val usn: String,
    val department: String,
    val role: String
)

@Serializable
data class Event(
    val id: String,
    val title: String,
    val description: String,
    @SerialName("club_name") val clubName: String,
    val location: String,
    @SerialName("event_date") val eventDate: String,
    @SerialName("registration_deadline") val registrationDeadline: String,
    @SerialName("max_capacity") val maxCapacity: Int?,
    @SerialName("banner_url") val bannerUrl: String?,
    @SerialName("created_by") val createdBy: String,
    @SerialName("approval_status") val approvalStatus: String,
    @SerialName("feedback_open") val feedbackOpen: Boolean = false,
    @SerialName("feedback_config") val feedbackConfig: List<FeedbackQuestion>? = null,
    @SerialName("targeted_department") val targetedDepartment: String? = null,
    @SerialName("rejection_data") val rejectionData: List<RejectionRemark>? = null
)

@Serializable
data class FeedbackQuestion(
    val type: String, // "text" | "rating" | "multiple_choice"
    val label: String,
    val options: List<String>? = null
)

@Serializable
data class RejectionRemark(
    val field: String,
    val reason: String
)

@Serializable
data class ReportContent(
    val summary: String,
    val outcomes: List<String>,
    val photos: List<String>
)

@Serializable
data class PeerProfile(
    val id: String,
    @SerialName("full_name") val fullName: String,
    val usn: String,
    val department: String
)

@Serializable
data class IdOnly(val id: String)
```

---

## 6. Android App Screen Map

```
                     ┌────────────────────────┐
                     │       Login Screen     │ ← Validate user role == "cc"
                     └───────────┬────────────┘
                                 ▼
                     ┌────────────────────────┐
                     │    My Event Pipeline   │ ← Stats cards: Drafts, In Review, Approved, Rejected.
                     │      (Home Dashboard)  │   Recent activity list view.
                     └─────┬─────────────┬────┘
                           │             │
      (Tap "Create Event") │             │ (Tap existing event)
                           ▼             ▼
┌──────────────────────────────┐     ┌────────────────────────────────────────────────────────┐
│     New Event Designer       │     │                   Event Management Hub                 │
│                              │     │                                                        │
│ • Date & Location Settings   │     │ • Status Progress bar (Status tracker indicator)       │
│ • Survey Designer (3+ Qs)    │     │ • View/Edit Rejections (if status is 'rejected')       │
│ • Venue Conflict Check Engine│     │ • Toggle Feedback Collection switch                    │
│ • "Save Draft" & "Submit"    │     │ • Registration Statistics / Public Interest count      │
└──────────────────────────────┐     │ • "Post Activity Report" section (Executive summary,   │
                                     │    gallery links, and points submission)                │
                                     └────────────────────────────────────────────────────────┘
```

---

## 7. Key Security Rules

1.  **Event Ownership Validation**: A Club Coordinator is only allowed to edit/update event drafts where `created_by` matches their logged-in User UUID. This is strictly enforced by Postgres RLS:
    ```sql
    CREATE POLICY "Staff and Owners can update events" ON events 
    FOR UPDATE USING (created_by = auth.uid());
    ```
2.  **Survey Integrity Gate**: Every event submission from the Android client must guarantee at least three survey questions are designed in `feedback_config` list, which is validated during the database insert/update operations.
3.  **Active Membership DM Enforcement**: CCs cannot write text messages into a conversation without an `accepted` conversation membership profile in `conversation_members`.

---

## 8. Summary of Web → Android Translation

| Web Page & Client Action | Android Implementation Workflow |
|---|---|
| **CC Dashboard** (`/cc/dashboard`) | Query `events` filtering where `created_by = auth.uid()` |
| **New Event Creator** (`/cc/events/create`) | Confirm chronologies → Execute 4-hr venue overlap query → Insert event & constraints in transactional flow |
| **Post-Event Activity Report** (`/cc/events/[id]/report`) | Upsert content into the `reports` table checking for conflicts on unique `event_id` constraint |
| **Peer Search / Invitation** | Find profiles match via `.or("full_name.ilike.%$query%,usn.ilike.%$query%")` → Insert invite record |
| **Feedback Collection Switch** | Direct update to `feedback_open` boolean column on the specific event record |

---

> [!IMPORTANT]
> When executing update operations on `events` that have been previously rejected, remember to pass `'[]'::jsonb` to `rejection_data` and reset `approval_status` back to `'draft'`. This guarantees the pipeline starts clean for faculty re-evaluations!

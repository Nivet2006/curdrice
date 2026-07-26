# PR Android App — Complete Technical Handoff

## 1. Supabase Connection


## 2. Database Schema (Only Tables You Need)

### 2.1 `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `full_name` | `text` | |
| `usn` | `text` UNIQUE | University Seat Number |
| `department` | `text` | e.g. "CSE", "ISE" |
| `semester` | `integer` | |
| `year` | `integer` | |
| `role` | `enum user_role` | Values: `student`, `manager`, `admin`, `deleted`, `cc`, `pr`, `teacher`, `hod` |
| `created_at` | `timestamptz` | default `now()` |

**RLS**: SELECT open to everyone (`true`).

### 2.2 `events`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `text` PK | Auto-generated via `generate_event_code()` |
| `title` | `text` | |
| `description` | `text` nullable | |
| `club_name` | `text` | |
| `location` | `text` nullable | |
| `event_date` | `timestamptz` | |
| `registration_deadline` | `timestamptz` nullable | |
| `max_capacity` | `integer` nullable | |
| `status` | `enum event_status` | `upcoming`, `ongoing`, `completed` |
| `banner_url` | `text` nullable | |
| `created_by` | `uuid` FK→profiles | |
| `created_at` | `timestamptz` | |
| `approval_status` | `enum` | `draft`, `pending_pr`, `pending_teacher`, `pending_hod`, `approved`, `rejected` |

**RLS**: SELECT open to everyone (`true`).

### 2.3 `registrations`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `event_id` | `text` FK→events | |
| `student_id` | `uuid` FK→profiles | |
| `qr_token` | `text` UNIQUE | A `crypto.randomUUID()` assigned at registration time |
| `checked_in` | `boolean` | default `false` |
| `checked_in_at` | `timestamptz` nullable | Set when marked present |
| `registered_at` | `timestamptz` | default `now()` |

**RLS for PR role**: SELECT allowed if user role is `pr` (via the policy that checks role in `['cc','manager','admin','teacher','hod','pr']`). UPDATE allowed if user role is `pr`.

### 2.4 `pr_event_assignments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `event_id` | `text` FK→events | |
| `pr_id` | `uuid` FK→profiles | The PR officer's user ID |
| `assigned_by` | `uuid` FK→profiles | The faculty who assigned |
| `assigned_at` | `timestamptz` | default `now()` |

**Unique constraint**: `(event_id, pr_id)` — a PR can only be assigned once per event.

**RLS**: SELECT allowed if `pr_id = auth.uid()` OR user is teacher/hod/admin.

---

## 3. QR Code Content Format

When a student registers, the web app generates:
```
qr_token = crypto.randomUUID()   // e.g. "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

The QR code displayed to students contains **either**:
- The raw UUID token: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- Or a URL with the token: `https://...?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890`

Your scanner must handle both. Extract logic from the web app:
```kotlin
fun extractToken(scannedText: String): String {
    val regex = Regex("token=([a-zA-Z0-9-]+)")
    val match = regex.find(scannedText)
    return match?.groupValues?.get(1) ?: scannedText
}
```

---

## 4. Complete Flow Logic

### 4.1 Login
The PR user logs in with Supabase Auth (email/password). After login, verify their role:

```kotlin
// After supabase.auth.signInWith(Email) { ... }
val userId = supabase.auth.currentUserOrNull()?.id ?: return

val profile = supabase.from("profiles")
    .select { filter { eq("id", userId) } }
    .decodeSingle<Profile>()

if (profile.role != "pr") {
    // Show error: "Only PR officers can use this app"
}
```

### 4.2 Get Assigned Events (Home Screen)

```kotlin
// Step 1: Get event IDs assigned to this PR
val assignments = supabase.from("pr_event_assignments")
    .select(columns = Columns.list("event_id")) {
        filter { eq("pr_id", userId) }
    }
    .decodeList<PrAssignment>()

val eventIds = assignments.map { it.eventId }
if (eventIds.isEmpty()) return emptyList()

// Step 2: Fetch full event data
val events = supabase.from("events")
    .select {
        filter { isIn("id", eventIds) }
        order("event_date", Order.DESCENDING)
    }
    .decodeList<Event>()

// Step 3: For each event, get registration + attendance counts
for (event in events) {
    val regCount = supabase.from("registrations")
        .select(columns = Columns.list("id"), head = true, count = Count.EXACT) {
            filter { eq("event_id", event.id) }
        }.countOrNull() ?: 0

    val attendanceCount = supabase.from("registrations")
        .select(columns = Columns.list("id"), head = true, count = Count.EXACT) {
            filter {
                eq("event_id", event.id)
                eq("checked_in", true)
            }
        }.countOrNull() ?: 0

    event.registrationCount = regCount
    event.attendanceCount = attendanceCount
}
```

### 4.3 Validate PR Assignment (Security Gate)

**Every scan/check-in MUST validate assignment first:**

```kotlin
suspend fun validatePRAssignment(prUserId: String, eventId: String): Boolean {
    val result = supabase.from("pr_event_assignments")
        .select(columns = Columns.list("id")) {
            filter {
                eq("pr_id", prUserId)
                eq("event_id", eventId)
            }
        }
        .decodeList<IdOnly>()
    return result.isNotEmpty()
}
```

### 4.4 QR Scan → Lookup Registration

```kotlin
suspend fun lookupQRToken(token: String): LookupResult {
    val cleanToken = extractToken(token)

    // Find registration by QR token
    val registration = supabase.from("registrations")
        .select(columns = Columns.list("id", "checked_in", "checked_in_at", "student_id", "event_id")) {
            filter { eq("qr_token", cleanToken) }
        }
        .decodeSingleOrNull<Registration>()
        ?: return LookupResult.Error("Invalid QR code. No matching registration found.")

    // Check assignment gate
    if (!validatePRAssignment(currentUserId, registration.eventId)) {
        return LookupResult.Error("Access denied: contact faculty. You are not assigned to this event.")
    }

    // Fetch student profile
    val student = supabase.from("profiles")
        .select(columns = Columns.list("full_name", "usn", "department", "semester", "year")) {
            filter { eq("id", registration.studentId) }
        }
        .decodeSingleOrNull<StudentProfile>()

    // Fetch event info
    val event = supabase.from("events")
        .select(columns = Columns.list("title", "event_date", "location")) {
            filter { eq("id", registration.eventId) }
        }
        .decodeSingleOrNull<EventInfo>()

    return LookupResult.Success(
        registrationId = registration.id,
        eventId = registration.eventId,
        alreadyCheckedIn = registration.checkedIn,
        checkedInAt = registration.checkedInAt,
        student = student,
        event = event
    )
}
```

### 4.5 Confirm Check-In (Mark Present)

```kotlin
suspend fun confirmCheckIn(registrationId: String, eventId: String): Result {
    // Re-validate assignment
    if (!validatePRAssignment(currentUserId, eventId)) {
        return Result.Error("Access denied: contact faculty.")
    }

    supabase.from("registrations")
        .update({
            set("checked_in", true)
            set("checked_in_at", Clock.System.now().toString())
        }) {
            filter { eq("id", registrationId) }
        }

    return Result.Success
}
```

### 4.6 Manual Check-In by USN (Fallback)

```kotlin
suspend fun manualCheckInByUSN(usn: String, eventId: String): Result {
    if (!validatePRAssignment(currentUserId, eventId)) {
        return Result.Error("Access denied: contact faculty.")
    }

    // Find student by USN
    val student = supabase.from("profiles")
        .select(columns = Columns.list("id", "full_name", "usn", "department")) {
            filter { eq("usn", usn.uppercase().trim()) }
        }
        .decodeSingleOrNull<StudentProfile>()
        ?: return Result.Error("No student found with USN: $usn")

    // Find their registration
    val registration = supabase.from("registrations")
        .select(columns = Columns.list("id", "checked_in", "checked_in_at")) {
            filter {
                eq("student_id", student.id)
                eq("event_id", eventId)
            }
        }
        .decodeSingleOrNull<Registration>()
        ?: return Result.Error("${student.fullName} ($usn) is not registered for this event.")

    if (registration.checkedIn) {
        return Result.Error("${student.fullName} is already checked in")
    }

    supabase.from("registrations")
        .update({
            set("checked_in", true)
            set("checked_in_at", Clock.System.now().toString())
        }) {
            filter { eq("id", registration.id) }
        }

    return Result.Success(studentName = student.fullName, studentUsn = student.usn)
}
```

### 4.7 Live Attendee List

```kotlin
suspend fun getEventAttendees(eventId: String): List<Attendee> {
    // Validate assignment first
    if (!validatePRAssignment(currentUserId, eventId)) {
        throw SecurityException("Access denied: contact faculty")
    }

    // Fetch all registrations for this event
    val registrations = supabase.from("registrations")
        .select(columns = Columns.list("id", "checked_in", "checked_in_at", "registered_at", "student_id")) {
            filter { eq("event_id", eventId) }
            order("registered_at", Order.ASCENDING)
        }
        .decodeList<Registration>()

    if (registrations.isEmpty()) return emptyList()

    // Fetch all student profiles in bulk
    val studentIds = registrations.map { it.studentId }
    val profiles = supabase.from("profiles")
        .select(columns = Columns.list("id", "full_name", "usn", "department", "semester", "year")) {
            filter { isIn("id", studentIds) }
        }
        .decodeList<StudentProfile>()

    val profileMap = profiles.associateBy { it.id }

    // Merge
    return registrations.map { reg ->
        val profile = profileMap[reg.studentId]
        Attendee(
            id = reg.id,
            fullName = profile?.fullName ?: "Unknown",
            usn = profile?.usn ?: "Unknown",
            department = profile?.department ?: "Unknown",
            semester = profile?.semester ?: 0,
            year = profile?.year ?: 0,
            checkedIn = reg.checkedIn,
            checkedInAt = reg.checkedInAt,
            registeredAt = reg.registeredAt
        )
    }
}
```

### 4.8 Realtime Subscription (Live Updates)

```kotlin
// Subscribe to registration changes for live attendance updates
val channel = supabase.channel("attendance-$eventId")

val changes = channel.postgresChangeFlow<PostgresAction>(schema = "public") {
    table = "registrations"
    filter = "event_id=eq.$eventId"
}

channel.subscribe()

changes.collect { action ->
    when (action) {
        is PostgresAction.Update -> {
            // Refresh the attendee list or update the specific record
            refreshAttendeeList()
        }
        else -> {}
    }
}
```

---

## 5. Data Models (Kotlin)

```kotlin
@Serializable
data class Profile(
    val id: String,
    @SerialName("full_name") val fullName: String,
    val usn: String,
    val department: String,
    val semester: Int,
    val year: Int,
    val role: String
)

@Serializable
data class Event(
    val id: String,
    val title: String,
    val description: String? = null,
    @SerialName("club_name") val clubName: String,
    val location: String? = null,
    @SerialName("event_date") val eventDate: String,
    val status: String? = null,        // "upcoming" | "ongoing" | "completed"
    @SerialName("banner_url") val bannerUrl: String? = null,
    @SerialName("max_capacity") val maxCapacity: Int? = null,
    // Computed fields (not from DB)
    var registrationCount: Long = 0,
    var attendanceCount: Long = 0
)

@Serializable
data class Registration(
    val id: String,
    @SerialName("event_id") val eventId: String,
    @SerialName("student_id") val studentId: String,
    @SerialName("qr_token") val qrToken: String? = null,
    @SerialName("checked_in") val checkedIn: Boolean = false,
    @SerialName("checked_in_at") val checkedInAt: String? = null,
    @SerialName("registered_at") val registeredAt: String? = null
)

@Serializable
data class PrAssignment(
    val id: String,
    @SerialName("event_id") val eventId: String,
    @SerialName("pr_id") val prId: String,
    @SerialName("assigned_at") val assignedAt: String? = null
)

@Serializable
data class Attendee(
    val id: String,
    val fullName: String,
    val usn: String,
    val department: String,
    val semester: Int,
    val year: Int,
    val checkedIn: Boolean,
    val checkedInAt: String?,
    val registeredAt: String?
)
```

---

## 6. Android App Screen Map

```
┌──────────────┐
│  Login Page  │  ← Supabase email/password auth, validate role == "pr"
└──────┬───────┘
       ▼
┌──────────────┐
│  My Events   │  ← List of assigned events with reg/attendance counts
│  (Home)      │     from pr_event_assignments → events
└──────┬───────┘
       ▼ (tap event)
┌──────────────────────────────────┐
│  Event Detail                    │
│  ┌────────────┐ ┌──────────────┐ │
│  │ Scan QR    │ │ Attendee List│ │  ← Two tabs/buttons
│  └─────┬──────┘ └──────┬───────┘ │
└────────┼───────────────┼─────────┘
         ▼               ▼
┌──────────────┐  ┌────────────────┐
│  QR Scanner  │  │  Live Attendee │
│  + Manual USN│  │  Table         │
│  + Confirm   │  │  (filter/search│
│    Card      │  │   present/     │
│              │  │   absent)      │
└──────────────┘  └────────────────┘
```

---

## 7. Key Security Rules

1. **Assignment Gate**: EVERY operation (scan, manual check-in, view attendees) MUST first verify `pr_event_assignments` contains a row with `pr_id = currentUser.id` AND `event_id = targetEvent.id`.

2. **RLS enforced server-side**: The anon key + authenticated session will enforce RLS. PR users can:
   - SELECT their own `pr_event_assignments`
   - SELECT all `events` (public)
   - SELECT all `profiles` (public)
   - SELECT `registrations` for events where their role is `pr`
   - UPDATE `registrations` for events where their role is `pr`

3. **The web app uses a service-role key** (`getAdminClient()`) for some operations to bypass RLS. In the Android app, since the PR user is authenticated, the standard anon key + user session should work for SELECT on events/profiles/registrations. For UPDATE on registrations, the existing RLS policy allows PR role users.

---

## 8. Gradle Dependencies

```kotlin
// build.gradle.kts (app)
dependencies {
    // Supabase
    implementation(platform("io.github.jan-tennert.supabase:bom:3.1.1"))
    implementation("io.github.jan-tennert.supabase:postgrest-kt")
    implementation("io.github.jan-tennert.supabase:auth-kt")
    implementation("io.github.jan-tennert.supabase:realtime-kt")
    implementation("io.ktor:ktor-client-android:3.1.1")

    // QR Scanner (ML Kit)
    implementation("com.google.mlkit:barcode-scanning:17.3.0")

    // CameraX (for scanner)
    implementation("androidx.camera:camera-camera2:1.4.1")
    implementation("androidx.camera:camera-lifecycle:1.4.1")
    implementation("androidx.camera:camera-view:1.4.1")
}
```

---

## 9. Summary of Web → Android Translation

| Web (Next.js Server Action) | Android (Direct Supabase Call) |
|---|---|
| `prLookupQRToken(token)` | `supabase.from("registrations").select().eq("qr_token", cleanToken)` → validate assignment → fetch profile + event |
| `prConfirmCheckIn(regId)` | `supabase.from("registrations").update({ checked_in: true, checked_in_at: now }).eq("id", regId)` |
| `prManualCheckInByUSN(usn, eventId)` | Find profile by USN → find registration → update checked_in |
| `getPRAssignedEvents()` | Query `pr_event_assignments` → query `events` by IDs → count registrations |
| `getEventAttendees(eventId)` | Query `registrations` by event_id → bulk query `profiles` → merge |
| `validatePRAssignment()` | `supabase.from("pr_event_assignments").select("id").eq("pr_id", uid).eq("event_id", eid)` |

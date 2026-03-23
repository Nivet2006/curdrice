# Feature Summary: Eligibility & Constraint Checks

**Date:** 2026-03-22
**Components:** `lib/actions/events.ts` (`registerForEvent` action)

## Overview
Enhanced the registration process for EventHub to strictly enforce student eligibility criteria, registration deadlines, and event capacity limits.

## Implemented Enhancements (6 Steps)
1. **Student Profile Retrieval**: Fetches the authenticated student's semester, year, and department. 
2. **Event Constraint Fetching**: Retrieves the active constraints for the requested event ID.
3. **Eligibility Validation**: Checks if the student falls within the `allowed_semesters`, `allowed_years`, and `allowed_departments`. 
   - Provides informative error messages (e.g., "This event is restricted to Semester X. You are in Semester Y").
4. **Deadline Check**: Blocks registration if the current time exceeds the `registration_deadline`.
5. **Capacity Check**: Blocks registration if the number of current registrations equals or exceeds `max_capacity`.
6. **Registration & Revalidation**: Inserts a new registration with a unique `qr_token` and triggers a server-side route revalidation for a seamless student experience.

## Cleanup
Successfully executed a full environment reset (`taskkill /F /IM node.exe` and `.next` purge) to ensure all server action logic is live and active.

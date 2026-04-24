# ClubEve CC Attendance App — Native (Android/iOS)

This folder contains the complete technical implementation for the ClubEve attendance app, supporting both Android and iOS with an **offline-first** architecture.

## Architecture
- **Local Database**: SQLite (`expo-sqlite`) for instant reading/writing without internet.
- **Remote Database**: Supabase for persistent storage and cross-platform synchronization.
- **Sync Logic**: Automatic background workers that push offline scans to the server once connectivity is restored.

## Folder Structure

### 1. `cross-platform/` (Recommended)
This is a **React Native + Expo** project. It's the fastest way to get a production-ready app for both platforms from a single codebase.
- **`src/screens/LoginScreen.tsx`**: Matches the branding and UI of your website.
- **`src/screens/EventListScreen.tsx`**: Allows CCs to "Download" an event's registered list for offline use.
- **`src/screens/ScannerScreen.tsx`**: Full-screen QR scanner with instant lookup and "Mark Present" flow.
- **`src/screens/AttendanceScreen.tsx`**: Full list view with search and manual toggle.
- **`src/lib/database.ts`**: Handles the local SQLite lifecycle.
- **`src/lib/sync.ts`**: The background sync service.

### 2. `android/` & `ios/` (Native References)
Contains native snippets (**Kotlin/Compose** for Android and **Swift/SwiftUI** for iOS) if you choose to build pure native apps instead of cross-platform.

## How to Run (React Native)
1. Install [Expo Go](https://expo.dev/go) on your phone.
2. Navigate to `cross-platform`.
3. Run `npm install`.
4. Run `npm start`.
5. Scan the QR code in your terminal to open the app.

---

**Note**: To fully connect the app, update `src/lib/supabase.ts` with your actual project URL and API key.

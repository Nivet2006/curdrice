# Testing Guide: ClubEve Native App

Follow these steps to validate the offline-first attendance flow on your device.

## 1. Prerequisites
- **Node.js** installed on your computer.
- **Expo Go** app installed on your physical phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) or [iOS](https://apps.apple.com/app/expo-go/id982107779)).
- Your computer and phone should be on the **same Wi-Fi network**.

## 2. Setup & Launch
1. Open your terminal and navigate to the project folder:
   ```powershell
   cd "NATIVE APP/cross-platform"
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the Expo development server:
   ```powershell
   npx expo start
   ```
4. A QR code will appear in your terminal. Scan it using:
   - **Android**: The "Scan QR Code" button inside the Expo Go app.
   - **iOS**: Your standard Camera app.

## 3. Test Scenarios

### Scenario A: Online Flow (Live Sync)
1. Log in with your USN.
2. Select an event.
3. Tap the "Download" icon next to the event to cache the list.
4. Go to the Scanner and scan a test QR (containing a USN).
5. Mark as Present.
6. **Verification**: Check your Supabase dashboard or the website. The student should be marked as present immediately.

### Scenario B: Offline Flow (The "Real" Test)
1. While on the Event Selection screen, ensure you have downloaded the list.
2. **Turn off Wi-Fi/Mobile Data** on your phone.
3. Scan a QR code.
4. Mark as Present.
   - *Result*: The app should show "Success" immediately because it's using the local SQLite database.
5. Go to the "Attendance List" screen in the app. You should see the student marked as present locally.
6. **Sync Verification**:
   - Turn your phone's Wi-Fi **back on**.
   - Wait ~10-20 seconds (or restart the app).
   - Check the website. The offline scan should now have synced to the server.

### Scenario C: Manual Override
1. Open the Attendance List for an event.
2. Manually tap a student's name to toggle their presence.
3. Verify that the checkmark updates instantly and syncs once online.

## 4. Troubleshooting
- **Connection Error**: If Expo Go says "Ready" but won't load, ensure your firewall isn't blocking port `8081`. Try running `npx expo start --tunnel` if Wi-Fi isolation is an issue.
- **Scanner Not Opening**: Ensure you granted camera permissions to the Expo Go app.
- **Supabase Keys**: Ensure you have replaced `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` in `src/lib/supabase.ts`.

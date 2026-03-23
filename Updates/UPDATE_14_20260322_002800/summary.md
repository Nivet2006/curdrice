# ERROR 14: "View QR Code" Button Not Functional
**Timestamp**: 2026-03-22 00:28:00
**Page/Component**: `app/student/events/[id]/page.tsx`
**Error Message**: User clicking "View QR Code" does not render the QR token module.

## Summary
The "View QR Code" button was acting as a primitive hardcoded HTML anchor (`<Link>`) forcing the user back to `/student/dashboard` instead of opening the custom internal `QRDisplay` modal to render their assigned event ticketing token.

## Solution
1. Rewrote the database query block within `[id]/page.tsx` pulling from `registrations` to eagerly execute a foreign join `profiles(full_name, usn)`. This natively accesses the user's name to pass to the QR renderer.
2. Abstracted the actual `<QRDisplay />` into an intermediate client actuator (`QRButton.tsx`).
3. Swapped out the raw HTML `Link` for the smart client component, binding `qr_token`, `full_name`, and `usn` dynamically into it. Clicking the button now pops up the custom-branded canvas modal identically to the original spec flawlessly.

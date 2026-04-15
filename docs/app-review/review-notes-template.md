# App Review Notes

## Sign-in

- Test with a member account or create a new member account using magic-code email sign-in, Sign in with Apple, or Google Sign-In.
- The app is member-facing only. There is no staff-side scanner or staff review account in the current build.

## Member QR Scanner

- Camera access is optional and is used only for the member self-scan bill QR flow.
- A sample review-safe QR payload is included in `docs/app-review/sample-member-qr.txt`.

## Permissions

- Location permission is optional and used on device for venue-arrival features.
- Notification permission is optional and used for booking and venue reminder flows.
- Date of birth is optional. Members can add it later in profile for birthday wishes and member birthday perks.

## Account Management

- In-app account deletion is available from the profile tab.
- Account deletion includes a 30-day restore window.

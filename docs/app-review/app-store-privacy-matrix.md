# App Store Privacy Matrix

This file is the human-review companion to `config/apple/privacy-manifest.json` and `config/app-store/privacy-checklist.json`.

## Collected Data

| Data type                   | Collected off device | Linked to user          | Tracking | Purpose                      | Repo evidence                                                            |
| --------------------------- | -------------------- | ----------------------- | -------- | ---------------------------- | ------------------------------------------------------------------------ |
| Email address               | Yes                  | Yes                     | No       | App functionality            | `$users.email`, `account_deletion_requests.email`, magic-code auth flows |
| Name                        | Yes                  | Yes                     | No       | App functionality            | `profiles.full_name`, private-event contact name                         |
| Date of birth               | Yes                  | Yes                     | No       | App functionality            | `profiles.date_of_birth`, onboarding profile setup                       |
| User ID / member identifier | Yes                  | Yes                     | No       | App functionality            | `$users.id`, `profiles.member_id`, `profiles.referral_code`              |
| Diagnostics / crash data    | Yes                  | Usually no at app level | No       | App functionality, analytics | `@sentry/react-native`, `captureHandledError`, breadcrumbs               |

## Not Collected Off Device In Current Repo

- Precise/background location is used on device for restaurant geofencing and venue-notification timing. The current code does not send coordinates to the backend.
- Camera access is used locally for member QR scanning. The current code does not upload captured images or frames.
- Notification permission is requested, but the current repo does not register or persist a push token.

## Manual Review Before Submission

- Re-check the submitted binary if Sentry user-identifying fields, server logging, or push-token registration change before release.
- If the private-event flow is enabled in the shipped build, review whether free-form notes should be disclosed as user content in App Store Connect.
- Keep App Store Connect privacy answers aligned with the release build even if third-party SDK manifests already declare some data categories.

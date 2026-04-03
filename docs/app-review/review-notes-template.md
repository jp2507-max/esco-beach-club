# iOS App Review Notes

Use this file as the App Review notes source of truth and replace every `REPLACE_BEFORE_SUBMIT_*` value before TestFlight/App Review submission.

## Demo Access

- Member demo email: `test@example.com`
- Member demo sign-in method: `Email magic code`
- Review login instructions: enter the demo email above and use magic code `424242`
- Staff demo account: not required for this submission
- Review contact name: `Jan-Peter Blohm`
- Review contact email: `jan-blohm@gmx.de`
- Review contact phone: `+491629864012`
- Sample member QR payload: see `docs/app-review/sample-member-qr.txt`

## Non-obvious Flows

- Background location is optional and only used on device to detect venue arrival for member-only in-venue offers.
- Notifications are optional and currently power local reservation reminders and venue/member offers.
- Camera access is staff-only and used locally to scan a member QR code for secure cashback adjustments.
- Sign in with Apple and Google sign-in are optional alternatives to email magic-code sign-in.
- Invite codes can be handled through the in-app invite route and the custom scheme `esco-beach-club://invite/<CODE>`. Public web links may open the hosted web route during review instead of a verified universal link.
- Account deletion is available in `Profile > Delete Account` and includes a 30-day restore period.

## Reviewer Guidance

- Staff QR scanning is not part of this review scope.
- If review cannot access production-like data, provide temporary seeded records for events, perks, referrals, and the QR sample member.
- Confirm that backend services and legal URLs are live during the review window.
- Confirm that `EXPO_PUBLIC_ACCOUNT_API_BASE_URL` and `EXPO_PUBLIC_REFERRAL_API_BASE_URL` point at reachable production endpoints in the submitted build.

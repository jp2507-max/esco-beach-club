# iOS App Review Notes

## Demo Access
- Member demo email: `TODO_MEMBER_DEMO_EMAIL`
- Member demo sign-in method: `Magic code / Google / Apple`
- Staff demo email: `TODO_STAFF_DEMO_EMAIL`
- Staff demo sign-in method: `Magic code / Google / Apple`
- Sample member QR payload: see `docs/app-review/sample-member-qr.txt`

## Non-obvious Flows
- Background location is optional and only used to detect venue arrival for member-only in-venue offers.
- Notifications are optional and used for reservation updates, reminders, and venue/member offers.
- Camera access is staff-only and used to scan a member QR code for secure cashback adjustments.
- Invite deep links route to `https://escolife.app/invite/<CODE>` and app deep links use `esco-beach-club://invite/<CODE>`.
- Account deletion is available in `Profile > Delete Account` and includes a 30-day restore period.

## Reviewer Guidance
- If Apple review needs to inspect staff QR scanning, sign in with the staff account above and open the hidden staff scanner flow.
- If review cannot access production-like data, provide screenshots or temporary seeded records for events, perks, and referrals.
- Confirm that backend services, legal URLs, and associated-domain files are live during the review window.

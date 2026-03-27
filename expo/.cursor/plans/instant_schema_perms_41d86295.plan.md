---
name: instant schema perms
overview: Replace the placeholder InstantDB setup with an MVP schema and deny-by-default permissions that match the app’s current real data needs, then swap the mock provider/API layer onto Instant queries and writes where the UI is already prepared for it.
todos:
  - id: design-schema
    content: Expand `instant.schema.ts` to the MVP entities, fields, indexes, and ownership links used by the current app.
    status: pending
  - id: lock-perms
    content: Replace open perms with deny-by-default rules, lock `attrs`, and add owner-scoped rules for profiles, reviews, and inquiries.
    status: pending
  - id: swap-provider-reads
    content: Move `providers/DataProvider.tsx` from generated mock data to Instant `useQuery` reads while preserving the existing hook API.
    status: pending
  - id: swap-write-stubs
    content: Replace mock `submitReview` and `submitPrivateEventInquiry` helpers with Instant transactions.
    status: pending
  - id: verify-rollout
    content: Check resulting types/lints, then prepare schema/perms push and shared-content seeding steps.
    status: pending
isProject: false
---

# InstantDB Schema And Permissions

## Docs Basis

- Latest docs checked from Instant:
  - [Permissions](https://www.instantdb.com/docs/permissions)
  - [Modeling data](https://www.instantdb.com/docs/modeling-data)
  - [Users](https://www.instantdb.com/docs/users)
  - [Workflow](https://www.instantdb.com/docs/workflow)
- Key doc takeaways to apply:
  - Use deny-by-default permissions because unspecified rules default to `true`.
  - Lock `attrs` creation in production so client transactions cannot create schema drift.
  - Link member profile data to Instant’s built-in `$users` namespace instead of treating auth and profile as unrelated records.
  - Use `request.modifiedFields` to restrict which profile fields a member can change.

## Scope

- First-pass persisted entities should cover what the app already consumes or submits today:
  - `profiles`
  - `events`
  - `news_items`
  - `partners`
  - `referrals`
  - `reviews`
  - `private_event_inquiries`
- Explicitly leave `bookings` out of this pass because [app/(modals)/booking/index.tsx](app/(modals)/booking/index.tsx) is still local-only UI with no real data contract yet.

## Files To Change

- [instant.schema.ts](instant.schema.ts)
- [instant.perms.ts](instant.perms.ts)
- [providers/DataProvider.tsx](providers/DataProvider.tsx)
- [lib/api.ts](lib/api.ts)
- Likely small supporting updates in:
  - [src/lib/instant.ts](src/lib/instant.ts)
  - [lib/types.ts](lib/types.ts)

## Schema Design

- Keep field names aligned with the current UI/types to avoid a mapper layer right now. The app already expects snake_case in [lib/types.ts](lib/types.ts) and [providers/DataProvider.tsx](providers/DataProvider.tsx).
- Model `profiles` as a one-to-one record linked to `$users`.
  - Keep member-facing fields already used by [app/(tabs)/home/index.tsx](app/(tabs)/home/index.tsx), [app/(tabs)/profile/index.tsx](app/(tabs)/profile/index.tsx), and [app/(tabs)/profile/invite.tsx](app/(tabs)/profile/invite.tsx): `full_name`, `tier`, `tier_label`, `member_id`, `points`, `max_points`, `earned`, `saved`, `avatar_url`, `referral_code`, `has_seen_welcome_voucher`, `created_at`, `updated_at`.
  - Add unique/indexed constraints where they are meaningful now: `member_id`, `referral_code`.
- Model shared catalog/content namespaces for authenticated members:
  - `events` with the fields currently rendered by [app/(tabs)/events/index.tsx](app/(tabs)/events/index.tsx) and [app/(shared)/events/[id].tsx](app/(shared)/events/[id].tsx).
  - `news_items` with the fields used by [app/(tabs)/home/index.tsx](app/(tabs)/home/index.tsx).
  - `partners` with the fields used by [app/(tabs)/perks/index.tsx](app/(tabs)/perks/index.tsx) and [app/(modals)/partner.tsx](app/(modals)/partner.tsx).
- Model user-owned / user-submitted namespaces:
  - `referrals` linked back to a profile as referrer.
  - `reviews` linked to the submitting profile/user and shaped to the form in [app/(modals)/rate-us.tsx](app/(modals)/rate-us.tsx).
  - `private_event_inquiries` linked to the submitting profile/user and shaped to the form in [app/(modals)/private-event.tsx](app/(modals)/private-event.tsx).
- Prefer links for ownership instead of only raw foreign-key strings wherever Instant queries/permissions benefit from them, while retaining current display fields that the UI already needs.

## Permission Model

- Replace the current fully-open rules in [instant.perms.ts](instant.perms.ts) with deny-by-default.
- Add top-level defaults:
  - `$default.allow.$default = 'false'`
  - `attrs.allow.create = 'false'`
- `$users`:
  - Own record view only.
  - No client create/update/delete beyond what Instant manages.
- Shared content namespaces (`events`, `news_items`, `partners`):
  - `view` allowed for authenticated users.
  - Client `create`, `update`, `delete` denied.
  - These stay dashboard/CLI/admin-managed until a trusted back-office path exists.
- `profiles`:
  - Owner can `view` own profile.
  - Owner can only update safe self-service fields such as `full_name`, `avatar_url`, `has_seen_welcome_voucher`.
  - Member cannot update `tier`, `tier_label`, `member_id`, `points`, `max_points`, `earned`, `saved`, or `referral_code`.
  - Use `request.modifiedFields` to enforce that split cleanly.
- `referrals`:
  - Owner can read their own referrals.
  - Client create/update/delete denied for now because the current app has no real referral write flow.
- `reviews` and `private_event_inquiries`:
  - Authenticated user can create records tied to themself.
  - User can read only their own records.
  - Update/delete denied unless there is a specific product need.

## App Integration

- Replace mock construction inside [providers/DataProvider.tsx](providers/DataProvider.tsx) with `db.useQuery(...)` hooks for profile, events, news, partners, and referrals.
- Keep the provider surface stable if possible so screens do not need broad refactors.
- Replace mock submit helpers in [lib/api.ts](lib/api.ts):
  - `submitReview(...)` should transact a `reviews` record.
  - `submitPrivateEventInquiry(...)` should transact a `private_event_inquiries` record.
- Decide whether to keep [lib/api.ts](lib/api.ts) as a thin Instant wrapper or inline the two writes into hooks/components; prefer the wrapper if it avoids churn.

## Validation And Rollout

- Verify the new schema/perms match current UI access patterns before pushing.
- Push in this order after code changes:
  1. `npx instant-cli@latest push schema`
  2. `npx instant-cli@latest push perms`
- Seed or create initial shared content (`events`, `news_items`, `partners`) through the Instant dashboard or CLI, since member-app writes will be locked down.
- Use the Instant Sandbox to debug any failed profile/read/write permission checks before finalizing.

## Notes

- `booking` should remain mock/local until the product decides the actual reservation model and status lifecycle.
- The highest-risk issue in the current repo is the open permission default in [instant.perms.ts](instant.perms.ts); that should be fixed before relying on Instant-backed member data.


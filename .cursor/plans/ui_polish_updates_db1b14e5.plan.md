---
name: UI polish updates
overview: Implement consistent profile sub-screen headers, refine key tab headers, remove duplicate QR UI from profile, add day-based event browsing, and surface the Da Nang 365 external CTA.
todos:
  - id: profile-header-system
    content: Create and roll out one shared custom header across profile sub-screens
    status: pending
  - id: home-header-polish
    content: Update home greeting and refine the top-right glass avatar button
    status: pending
  - id: profile-qr-removal
    content: Remove the QR access-pass block from the profile root screen
    status: pending
  - id: events-week-strip
    content: Add a custom weekly calendar strip and day-based event filtering
    status: pending
  - id: perks-danang-cta
    content: Add the Da Nang 365 external CTA and supporting copy
    status: pending
isProject: false
---

# UI Polish & Navigation Updates

## Approach

- Reuse the visual pattern from [app/(tabs)/profile/membership.tsx](<app/(tabs)/profile/membership.tsx>) and the existing glass button primitive in [src/components/ui/header-glass-button.tsx](src/components/ui/header-glass-button.tsx) by introducing one shared profile sub-screen header: glass back button on the left, unified title typography/spacing, and no right-side avatar/action.
- Update [app/(tabs)/profile/\_layout.tsx](<app/(tabs)/profile/_layout.tsx>) so `edit-profile`, `invite`, `saved-events`, `theme-preference`, and `help-center` stop using mixed native headers and instead render the same in-screen header treatment as `membership`.
- Refine [app/(tabs)/home/index.tsx](<app/(tabs)/home/index.tsx>) so the main header reads `Welcome back, {{name}}` and the top-right avatar remains inside a more native-feel glass button using the existing `HeaderGlassButton` path rather than a separate custom control.
- Remove the `MemberQrCode` access-pass block from [app/(tabs)/profile/index.tsx](<app/(tabs)/profile/index.tsx>) and rebalance the remaining layout so the profile tab focuses on member details, stats, actions, and support.
- Add a custom weekly date strip to [app/(tabs)/events/index.tsx](<app/(tabs)/events/index.tsx>) instead of a new calendar dependency. Current event data already provides `date`, `time`, and `day_label` through [lib/types.ts](lib/types.ts) and [src/lib/mappers.ts](src/lib/mappers.ts), so the plan is to derive the current week locally, highlight days that contain events, and filter the visible event content to the selected day while preserving category and search filters.
- Add a prominent external CTA for Da Nang 365 in [app/(tabs)/perks/index.tsx](<app/(tabs)/perks/index.tsx>), linking to [https://danang365.com/en/home/](https://danang365.com/en/home/). The safest placement is as a high-visibility header card above the partner grid so it reads as a featured city/perks guide.

## Files To Touch

- Profile header unification: [app/(tabs)/profile/\_layout.tsx](<app/(tabs)/profile/_layout.tsx>), [app/(tabs)/profile/membership.tsx](<app/(tabs)/profile/membership.tsx>), [app/(tabs)/profile/edit-profile.tsx](<app/(tabs)/profile/edit-profile.tsx>), [app/(tabs)/profile/invite.tsx](<app/(tabs)/profile/invite.tsx>), [app/(tabs)/profile/saved-events.tsx](<app/(tabs)/profile/saved-events.tsx>), [app/(tabs)/profile/theme-preference.tsx](<app/(tabs)/profile/theme-preference.tsx>), [app/(tabs)/profile/help-center.tsx](<app/(tabs)/profile/help-center.tsx>)
- Shared UI support: [src/components/ui/header-glass-button.tsx](src/components/ui/header-glass-button.tsx) and likely a new reusable profile header component under `src/components/ui/`
- Screen polish: [app/(tabs)/home/index.tsx](<app/(tabs)/home/index.tsx>), [app/(tabs)/profile/index.tsx](<app/(tabs)/profile/index.tsx>), [app/(tabs)/events/index.tsx](<app/(tabs)/events/index.tsx>), [app/(tabs)/perks/index.tsx](<app/(tabs)/perks/index.tsx>)
- Copy updates for any new labels/empty states: [src/lib/i18n/locales/en/home.ts](src/lib/i18n/locales/en/home.ts), [src/lib/i18n/locales/en/events.ts](src/lib/i18n/locales/en/events.ts), [src/lib/i18n/locales/en/profile.ts](src/lib/i18n/locales/en/profile.ts), plus the `ko` and `vi` counterparts where new strings are introduced

## Validation

- Verify every profile sub-screen now shares the same header spacing, title hierarchy, and glass back button behavior.
- Verify the Events week strip filters the list to the tapped day and still composes correctly with existing search/category filtering.
- Verify the Profile tab no longer duplicates QR functionality.
- Verify the Da Nang 365 CTA is prominent, accessible, and opens the external link correctly.

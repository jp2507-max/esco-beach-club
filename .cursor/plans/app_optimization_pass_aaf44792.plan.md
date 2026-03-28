---
name: app optimization pass
overview: Audit the Expo 55 app for high-leverage optimizations and stage the work into native navigation/UI upgrades, startup/data-layer cleanup, rendering fixes, and safe config pruning. Prioritize changes that improve platform fidelity and reduce unnecessary work before chasing experimental bundle flags.
todos:
  - id: native-nav-surface
    content: "Migrate the highest-value navigation/UI surfaces to native primitives: tabs, headers, search, and modal presentations."
    status: in_progress
  - id: startup-data-cleanup
    content: Reduce startup/auth-path work by fixing splash timing, removing redundant auth reads, and scoping or replacing global mock data providers.
    status: in_progress
  - id: rendering-hotspots
    content: Eliminate whole-screen rerender and animation hotspots in forms, invite progress, and home feed composition.
    status: in_progress
  - id: deps-config-prune
    content: Prune unused dependencies/config, fix missing asset references, and only test unstable Metro flags behind an isolated spike.
    status: pending
  - id: verify-regressions
    content: Validate iOS/Android behavior for native tabs, modal presentations, safe areas, and route flows before broader rollout.
    status: pending
isProject: false
---

# App Optimization Roadmap

Rules applied: `RNProject`, `Uniwind`, `Reanimated`, `UserRule-Exa/Context7`

## What To Optimize First

The highest-leverage remaining work is not low-level animation tuning. It is:

- Replacing JS navigation/UI patterns with Expo Router native primitives.
- Removing unnecessary work from the auth/startup path.
- Fixing a few screens that rerender too much or animate layout properties.
- Pruning stale dependencies/config instead of enabling risky experimental bundler flags too early.

Relevant repo anchors:

- [app/_layout.tsx](app/_layout.tsx)
- [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx)
- [app/(modals)/_layout.tsx](app/(modals)/_layout.tsx)
- [providers/AuthProvider.tsx](providers/AuthProvider.tsx)
- [providers/DataProvider.tsx](providers/DataProvider.tsx)
- [app/(modals)/rate-us.tsx](app/(modals)/rate-us.tsx)
- [app/(modals)/private-event.tsx](app/(modals)/private-event.tsx)
- [app/(tabs)/home/index.tsx](app/(tabs)/home/index.tsx)
- [app/(tabs)/profile/invite.tsx](app/(tabs)/profile/invite.tsx)
- [metro.config.js](metro.config.js)
- [app.json](app.json)

## Phase 1: Native Navigation And Modal Pass

1. Replace JS tabs in [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) with `expo-router/unstable-native-tabs` where the design still fits the platform.
  Why: Expo SDK 55 now treats native tabs as a first-class path, and the current file still uses JS `Tabs` plus fully custom tab bar styling.
2. Remove `headerShown: false` as the default escape hatch in stack layouts such as [app/(shared)/_layout.tsx](app/(shared)/_layout.tsx), [app/(tabs)/home/_layout.tsx](app/(tabs)/home/_layout.tsx), and [app/(tabs)/profile/_layout.tsx](app/(tabs)/profile/_layout.tsx).
  Why: several screens rebuild their own top bars with manual `useSafeAreaInsets()`, which blocks native headers, native safe-area handling, and search integration.
3. Convert modal screens to true route-level presentations instead of routing modally and then drawing custom overlays inside the screen.
  Most obvious targets:
  - [app/(modals)/partner.tsx](app/(modals)/partner.tsx)
  - [app/(modals)/modal.tsx](app/(modals)/modal.tsx)
  - [app/(modals)/booking/_layout.tsx](app/(modals)/booking/_layout.tsx)
4. Evaluate `presentation: 'formSheet'` for booking, feedback, and private-event flows where the UX is form-like.
  Best candidates:
  - [app/(modals)/booking/index.tsx](app/(modals)/booking/index.tsx)
  - [app/(modals)/rate-us.tsx](app/(modals)/rate-us.tsx)
  - [app/(modals)/private-event.tsx](app/(modals)/private-event.tsx)
5. Move the event search UI from the screen body in [app/(tabs)/events/index.tsx](app/(tabs)/events/index.tsx) into the native stack search/header API where it fits.

## Phase 2: Startup And Data-Layer Cleanup

1. Fix splash timing in [app/_layout.tsx](app/_layout.tsx).
  Current issue: `SplashScreen.hideAsync()` runs on mount before auth/bootstrap is ready, so the native splash disappears only to reveal a JS loading screen.
2. Stop mounting [providers/DataProvider.tsx](providers/DataProvider.tsx) for unauthenticated routes.
  Why: auth screens do not need profile/events/news/partners/referrals mock contexts.
3. Remove the redundant `db.getAuth()` read from [providers/AuthProvider.tsx](providers/AuthProvider.tsx) after `signInWithMagicCode()`, because the provider already subscribes through `db.useAuth()`.
4. Decide on one direction for app data:
  - Short term mock app: simplify/remove global React Query usage if it only wraps two mutations.
  - Real data soon: replace mock provider selectors with screen-scoped InstantDB or React Query reads.
5. If React Query stays global, wire native lifecycle/offline behavior correctly in [app/_layout.tsx](app/_layout.tsx) using `focusManager` + `AppState` and `onlineManager` + `NetInfo`.

## Phase 3: Rendering And Animation Hotspots

1. Replace route-level `watch()` subscriptions with narrower `useWatch()` or field-scoped components in:
  - [app/(modals)/rate-us.tsx](app/(modals)/rate-us.tsx)
  - [app/(modals)/private-event.tsx](app/(modals)/private-event.tsx)
   Why: comment typing and field edits currently rerender large parts of each screen.
2. Change invite progress animation in [app/(tabs)/profile/invite.tsx](app/(tabs)/profile/invite.tsx) from `width`/`left` animation to transform-based motion where possible.
3. Prepare [app/(tabs)/home/index.tsx](app/(tabs)/home/index.tsx) for real data scale.
  Why: the home feed still renders event/news sections in a vertical `ScrollView`; this is acceptable for mock data, but it will become a scaling bottleneck.
4. Extract heavy list/item UI into memoized row components in event/perk/menu/home surfaces once the data layer becomes real.

## Phase 4: Dependency And Config Pruning

1. Remove unused packages and duplicate capabilities after repo-wide verification.
  Strong suspects from the audit: `@expo/vector-icons`, `expo-symbols`, `expo-blur`, `expo-font`, `expo-web-browser`, `expo-image-picker`, `expo-location`, `expo-linking`, `expo-system-ui`, `zustand`, `react-native-get-random-values`, `@stardazed/streams-text-encoding`, `@ungap/structured-clone`, `@react-native-community/netinfo` if Query offline wiring is not added.    keep them all for now please!!!
2. Clean up stale config in [app.json](app.json) and [babel.config.js](babel.config.js).
  - [app.json](app.json) points at missing `assets/images/*` files.
  - `expo-font` / `expo-web-browser` plugins may be stale.
  - `@babel/plugin-proposal-export-namespace-from` may be removable.
3. Treat Metro optimize-graph/tree-shaking as a separate experiment only.
  Reason: current Expo ecosystem reports show instability with `react-native-reanimated` and `react-native-svg`, both relevant to this app. Do not make this part of the first optimization pass.

## Validation Notes

- Native tabs in Expo Router are aligned with SDK 55, but still alpha; test iOS, Android, and web fallbacks before broad rollout.
- Form sheet suitability should be verified on real devices, especially for long-scroll forms with bottom CTAs.
- Keep branded full-bleed screens where native headers materially hurt the product feel; not every screen should be normalized.

## Success Criteria

- Fewer manual safe-area/header implementations.
- No JS loading flash between native splash and authenticated routing.
- Modal flows use route-native presentation by default.
- Form screens stop rerendering whole routes on every keystroke.
- Smaller dependency/config surface without taking on unstable Metro risk.


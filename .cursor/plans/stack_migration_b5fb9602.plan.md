---
name: stack migration
overview: Refactor the current Expo 55 MVP to the repo’s target UI stack by replacing `StyleSheet` + RN `Animated` with Uniwind + Reanimated v4, and modernize existing input screens to `react-hook-form` + `zod` without changing current design or behavior. This plan explicitly excludes auth/data backend replacement, i18n rollout, InstantDB, and Sentry for now.
todos:
  - id: foundation-stack
    content: Add the missing Uniwind, Reanimated, and form dependencies and update Metro/Babel/CSS entry configuration.
    status: pending
  - id: token-wrapper-layer
    content: Introduce theme tokens, `@/src/tw` wrappers, `cn`, and shared motion helpers so screen migrations have a stable foundation.
    status: pending
  - id: migrate-core-screens
    content: Refactor the highest-impact route files from `StyleSheet` to Uniwind while preserving current visual output.
    status: pending
  - id: migrate-animations
    content: Replace RN `Animated` usage with Reanimated v4 shared values, animated styles, and layout builders without changing motion feel.
    status: pending
  - id: modernize-forms
    content: Convert current input screens to `react-hook-form` + `zod` using reusable controlled field primitives.
    status: pending
  - id: verify-parity
    content: Lint and smoke-test the migrated app for visual, behavioral, and motion regressions.
    status: pending
isProject: false
---

# MVP To Target Stack

## Scope

- Migrate styling to Uniwind/Tailwind CSS v4 patterns from the rule files.
- Migrate animations from `react-native` `Animated` to Reanimated v4 + `react-native-worklets` patterns.
- Upgrade existing user-input screens to `react-hook-form` + `zod` while preserving current UX/copy/API contracts.
- Keep current Supabase/auth/data architecture in place for this migration.

## Current Gaps Confirmed

- `[package.json](package.json)` is missing the target UI/form packages: `uniwind`, `tailwindcss`, `react-native-reanimated`, `react-hook-form`, `@hookform/resolvers`, `zod`.
- `[metro.config.js](metro.config.js)` is still plain Expo config; Uniwind docs require wrapping Metro with `withUniwindConfig(...)` and a relative `cssEntryFile`.
- `[babel.config.js](babel.config.js)` is missing the Reanimated 4-era worklets plugin (`react-native-worklets/plugin`).
- Route files under `[app/](app/)` still use `StyleSheet` and RN `Animated` directly.

```1:5:metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
```

```35:66:app/(tabs)/index.tsx
const cardScale = useRef(new Animated.Value(0.95)).current;
const cardOpacity = useRef(new Animated.Value(0)).current;
const fadeIn = useRef(new Animated.Value(0)).current;
const slideUp = useRef(new Animated.Value(30)).current;

useEffect(() => {
  Animated.parallel([
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }),
```

```55:67:app/private-event.tsx
const handleSubmit = () => {
  if (!isValid) {
    Alert.alert('Missing Info', 'Please fill in the event type, date, and estimated guests.');
    return;
  }
  inquiryMutation.mutate();
  setSubmitted(true);
  Animated.spring(checkAnim, {
    toValue: 1,
    friction: 5,
    tension: 80,
    useNativeDriver: true,
  }).start();
};
```

## Package And Config Migration

1. Update `[package.json](package.json)` with the UI/form packages required by the chosen target scope:

- Runtime: `uniwind`, `react-native-reanimated`, `react-hook-form`, `@hookform/resolvers`, `zod`
- Dev/runtime support per Uniwind docs: `tailwindcss`
- Keep existing `react-native-worklets` and `react-native-safe-area-context`

1. Create `[global.css](global.css)` or `[src/global.css](src/global.css)` with `@import 'tailwindcss';` and `@import 'uniwind';`, then define the repo’s theme tokens there.
2. Update `[metro.config.js](metro.config.js)` to use `withUniwindConfig(config, { cssEntryFile: './src/global.css' })` (relative path only, per docs).
3. Update `[babel.config.js](babel.config.js)` to add `react-native-worklets/plugin` so Reanimated 4 + worklets are configured correctly.
4. Import the CSS entry once from the app root, most likely in `[app/_layout.tsx](app/_layout.tsx)`.

## Design System Alignment

1. Convert `[constants/colors.ts](constants/colors.ts)` into the JS mirror of the rule-file tokens instead of the current MVP-only palette.
2. Introduce the wrapper layer expected by the rules:

- `[src/tw/index.ts](src/tw/index.ts)`
- `[src/tw/image.ts](src/tw/image.ts)`
- `[src/tw/animated.ts](src/tw/animated.ts)`
- `[src/lib/utils.ts](src/lib/utils.ts)` for `cn`

1. Add shared motion helpers in `[src/lib/animations/motion.ts](src/lib/animations/motion.ts)` so durations, springs, and reduced-motion behavior are centralized before screen rewrites begin.
2. Move shared static UI patterns out of route files where worthwhile, but only after parity-safe wrappers/tokens exist.

## Screen Refactor Strategy

- Convert every route in `[app/](app/)` from `StyleSheet`-driven static styling to stable `className` usage.
- Keep dynamic values in `style` only when they are actually dynamic (safe-area paddings, measured widths, transforms, gradient props, etc.).
- Migrate highest-risk screens first because they set most of the visual language and contain the densest animation logic:
  - `[app/(tabs)/index.tsx](app/(tabs)`/index.tsx)
  - `[app/(tabs)/profile.tsx](app/(tabs)`/profile.tsx)
  - `[app/event-details.tsx](app/event-details.tsx)`
  - `[app/private-event.tsx](app/private-event.tsx)`
  - `[app/booking-modal.tsx](app/booking-modal.tsx)`
  - `[app/invite.tsx](app/invite.tsx)`
- Then migrate the remaining route files and the app shell, including `[app/_layout.tsx](app/_layout.tsx)`.

## Animation Migration Strategy

1. Replace RN `Animated.Value` with Reanimated shared values.
2. Replace RN `Animated.View` with the repo’s animated wrapper layer.
3. Convert imperative `Animated.timing` / `Animated.spring` chains to:

- `useSharedValue`
- `useAnimatedStyle`
- `withTiming` / `withSpring`
- entering/exiting/layout animations where they preserve the same feel

1. Follow the repo rules during migration:

- use `.get()` / `.set()` for shared values because React Compiler is enabled in `[app.json](app.json)`
- keep static styles in `className`, animated values in Reanimated `style`
- prefer `scheduleOnRN` / `scheduleOnUI` from `react-native-worklets` over deprecated thread helpers
- respect reduced motion via centralized motion helpers

1. Match current animation timing/feel first; only refine motion after parity is verified.

## Form Modernization

- Migrate existing input screens, not the whole app architecture.
- Start with:
  - `[app/private-event.tsx](app/private-event.tsx)`
  - `[app/login.tsx](app/login.tsx)`
  - `[app/signup.tsx](app/signup.tsx)`
  - `[app/rate-us.tsx](app/rate-us.tsx)`
  - any other route with user-entered data discovered during implementation
- Add schema definitions to `[src/lib/forms/schemas.ts](src/lib/forms/schemas.ts)`.
- Add reusable controlled fields/components under `[src/lib/forms/](src/lib/forms/)` and `[src/components/ui/](src/components/ui/)` as needed.
- Preserve the current submission behavior and backend payloads; this is a validation/state-management refactor, not an API redesign.

## Verification

- Run lint after the migration and fix any new diagnostics in touched files.
- Smoke-test critical flows: home, events, event detail, booking, private event, invite, auth, profile.
- Check for visual parity on spacing, typography, gradients, icon sizing, safe-area behavior, and modal presentations.
- Watch for the main regression risks:
  - className/style conflicts changing layout
  - altered spring feel when replacing RN `Animated`
  - dark-mode token mismatches once CSS themes are introduced
  - form validation changing when fields become controlled/schema-driven

## Notes From Current Docs

- Uniwind docs require Metro wrapping via `withUniwindConfig` and a relative `cssEntryFile`; the CSS entry also defines the scan root.
- Reanimated 4 is New Architecture only, depends on `react-native-worklets`, and expects `react-native-worklets/plugin` in Babel.
- Rule-file constraints still apply during implementation: `@/src/tw` wrappers, stable `className`, Reanimated styles for motion, `Controller` for React Native forms, and `zod` v4 semantics.

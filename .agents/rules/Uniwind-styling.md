---
trigger: always_on
---

# Uniwind Styling Guidelines

## Core Principles

- Keep `className` **stable**. Static styles in `className`, animated/gesture styles via Reanimated `style`.
- Prefer explicit `dark:` pairs (e.g., `bg-background dark:bg-dark-bg`) for all themed elements, as CSS variables do not auto-switch modes.

- Never toggle Tailwind classes per frame; derive animation values in worklets.
- Always respect Reduced Motion:
  - Detect system `prefers-reduced-motion` and disable or simplify non-essential animations/gestures
  - Use `ReduceMotion.System` in all Reanimated worklets and animated styles
  - Verify smooth transitions with Expo Dev Menu FPS monitor
- Class order: layout → flex → spacing → size → border → bg → text → effects → dark.
- Custom components must forward/merge `className` via `cn` (tailwind-merge).

---

## UI & Theming (Uniwind + Tailwind CSS v4)

- **CSS runtime**: Uniwind via `@import 'tailwindcss';` and `@import 'uniwind';` in `global.css`, configured with `withUniwindConfig` in `metro.config.js` using a **relative** `cssEntryFile` path.
- **Color tokens**: defined in `global.css` `@theme` block (CSS-first, no `tailwind.config.js`). JS-side mirror in `constants/colors.ts` (default export) for use outside className.
- **Dark mode**: `userInterfaceStyle: "automatic"` in `app.json`. Uniwind supports both `dark:` variants and CSS-variable theming.
- **Theme styling default**: use standard light/dark pairs (`bg-background dark:bg-dark-bg`) for all shared UI as variables do not auto-switch.

- **useColorScheme**: import from `react-native` when JS logic needs scheme values.
- **Theme providers**: no styling-library ThemeProvider is required; keep React Navigation `ThemeProvider` only for APIs that require JS theme colors (navigation container, headers).
- **Safe area**: handled via `react-native-safe-area-context` using the `useSafeAreaInsets` hook. Uniwind is used only for styling via `withUniwind` / `withUniwindConfig`.

---

## Component Imports (Critical)

All RN components that use `className` should follow our local wrapper conventions:

- **`@/src/tw`**: `View`, `Text`, `Pressable`, `ScrollView`, `TextInput`, `KeyboardAvoidingView`, `GestureHandlerRootView`, `Link`, `TouchableHighlight`, `AnimatedScrollView`
- **`@/src/tw/image`**: `Image` (wraps `expo-image` + project styling conventions)
- **`@/src/tw/animated`**: `Animated` (project wrapped animated primitives)
- **`react-native` directly**: only for non-className APIs (`ActivityIndicator`, `Switch`, `Modal`, `BackHandler`, `useWindowDimensions`, `useColorScheme`, `Platform`, type imports like `TextInputProps`)
- **`react-native-reanimated` directly**: only when using `style` without `className` (e.g., `Animated.View style={animatedStyle}` with no className), or for `Animated.ScrollView` when a ref is needed
- **Third-party components**: wrap with `withUniwind` at module scope when they do not support `className`.

---

## Esco Beach Club Color Tokens

For JS values, import `Colors` from `@/constants/colors`.

Standard Light/Dark pairs (match `global.css` `@theme` block):

- App background: `bg-background dark:bg-dark-bg`
- Elevated surface: `bg-card dark:bg-dark-bg-card`
- Elevated container: `bg-white dark:bg-dark-bg-elevated`
- Border: `border-border dark:border-dark-border`
- Border accent: `border-border-light dark:border-dark-border-bright`
- Primary text: `text-text dark:text-text-primary-dark`
- Secondary text: `text-text-secondary dark:text-text-secondary-dark`
- Muted text: `text-text-muted dark:text-text-muted-dark`
- Brand / CTA: `bg-primary dark:bg-primary-bright`, `text-primary dark:text-primary-bright`
- Danger: `bg-danger dark:bg-error-dark`
- Warning: `bg-warning dark:bg-warning-dark`

---

## Component className Forwarding

Custom components **must** forward and merge `className` props:

```tsx
import { cn } from '@/src/lib/utils';

function Card({ className, ...props }: { className?: string }) {
  return (
    <View
      className={cn('rounded-lg bg-card p-4 dark:bg-dark-bg-card', className)}
      {...props}
    />
  );
}
```

---

## ✅ Do / Avoid

**Do**: Prefer token-based theme classes; keep `className` stable; use Tailwind for static styles; forward `className` via `cn`; use tokens from `global.css` `@theme`; import components from `@/src/tw` when using `className`.

**Avoid**: Per-frame class churn; hard-coded hex colors in className; importing `View`/`Text`/etc from `react-native` when using `className`.

---

## Animation & Motion Guidance

- Tailwind remains for **static layouts**; drive motion with Reanimated styles (`style={animatedStyle}`) so the fluent UI runtime handles transforms/opacity. Keep `className` stable and inject dynamic values through `useAnimatedStyle`, `Animated.View`, or gesture worklets.
- Prefer the shared motion tokens in `src/lib/animations/motion.ts` (`motion.dur`, `motion.ease`, `motion.spring`, `withRM`, `rmTiming`) when configuring timing/spring values so duration semantics (xs/sm/md/lg) and reduced-motion handling stay consistent.
- Use layout animation builders (`withRM`, `FadeIn`, `LinearTransition`, etc.) for mount/unmount changes and always cancel long-lived animations (`cancelAnimation(sharedValue)`) during cleanup effects.
- When composing shared transitions, use `sharedTransitionTag` prefixes scoped by feature (e.g., `feed.post.image`, `settings.avatar`) so hooks remain discoverable across screens. See `src/lib/animations/shared.ts` for the `sharedTag()` helper.
- State-driven animations should leverage `useSharedValue`, `useAnimatedStyle`, and helpers such as `interpolateColor` to interpolate between definitions instead of toggling classes; keep per-frame math inside worklets and only schedule JS side effects via `scheduleOnRN` (haptics, analytics, logging).

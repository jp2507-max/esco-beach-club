---
applyTo: '**'
---

# React Native Reanimated Guidelines (4.x, Expo SDK 55)

---

## Worklets — What runs on the UI thread

- **Auto‑workletization**: callbacks passed to Reanimated APIs (`useAnimatedStyle`, `useDerivedValue`, `useAnimatedReaction`, gesture callbacks, entering/exiting/layout) run on the **UI runtime**. No `'worklet'` directive needed.
- **Avoid `'worklet'`** in 99.9% of cases. The worklets plugin handles conversion automatically for Reanimated APIs and scheduling functions.
- **`scheduleOnUI`**: workletizes the callback and schedules it on the UI runtime (define with `useCallback` and pass by reference).
- **`scheduleOnRN`**: schedules a JS callback from a worklet—does **not** workletize. Use for side-effects like state updates or async work.
- **When `'worklet'` IS needed**: Only when a function defined outside Reanimated APIs (e.g., with `useCallback`) is called **directly** inside a worklet context (gesture `.onUpdate()`, inside `useAnimatedStyle`, etc.), not through `scheduleOnUI`/`scheduleOnRN`.
- **React Compiler**: Use `.get()/.set()` methods instead of `.value` property for React Compiler compatibility (applies everywhere: worklets, effects, callbacks).
- **One write per frame**: don't set the same shared value multiple times in a single tick.
- **No hooks in worklets**.

```ts
// ✅ Auto‑workletized - no 'worklet' needed
const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

// ✅ scheduleOnUI - no 'worklet' needed
const updateScale = useCallback(() => {
  scale.set(withSpring(1.2));
}, []);
scheduleOnUI(updateScale);

// ✅ 'worklet' IS needed - called directly in gesture context
const checkThreshold = useCallback((y: number) => {
  'worklet';
  return y > 100;
}, []);

const gesture = Gesture.Pan().onUpdate((e) => {
  if (checkThreshold(e.absoluteY)) {
    // direct call in worklet
    scale.set(1.2);
  }
});
```

---

## ✅ Do / Avoid (Quick)

**Do**: Tailwind for static, Reanimated for dynamic; respect Reduced Motion.

**Do**: in this repo, use `@/src/tw/animated` when animated components also use `className`; import animation hooks/APIs from `react-native-reanimated`.

**Avoid**: per-frame class churn; per-frame `scheduleOnRN`.

---

## 🧠 Worklet Offloading (TL;DR)

- If logic runs **per frame/gesture** and **doesn’t need React state**, make it a **worklet**.
- Candidates: interpolation/physics, clamping/throttling, hit‑testing, gesture math, small in‑memory filters/scoring tied to UI.
- One‑shot heavy calc tied to UI:

```ts
const doUiWork = useCallback(() => {
  // expensive but synchronous logic here
}, []);

scheduleOnUI(doUiWork);
```

### Captures (Closures)

- Capture only **small, serializable** values. Avoid large objects/functions; pass **params** or use **Shared Values**.

### `scheduleOnRN` — DO / DON'T

**DO:** Haptics/toasts, analytics, logging, update React state **after** animation/gesture.

**DON'T:** Call **per frame** or inside `onUpdate` loops; timing‑critical UI logic.

### Async & Side‑Effects

- Worklets are **synchronous & side‑effect‑free** (no network/storage/timers). For async/IO, jump to JS via `scheduleOnRN`.

### Quick Perf Check

- Use Expo Dev Menu FPS monitor; ensure animations stay smooth while JS is busy.
- Log only on **events** (start/finish) via `scheduleOnRN`, not every frame.

---

## Class Churn vs Animated Style

**Bad** (recomputes classes every frame):

```tsx
// ❌ don't flip classes per frame or read .value in render
<View className={progress.get() > 0.5 ? 'opacity-100' : 'opacity-50'} />
```

**Good:**

```tsx
// When combining className + animated style, import Animated from @/src/tw/animated
import { Animated } from '@/src/tw/animated';
const opacity = useSharedValue(0.5);
const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
return <Animated.View style={style} className="bg-primary rounded-xl" />;
```

---

## 🎛️ Animation Strategy & Syntax (Cheat)

**1. State-Driven Animations (Continuous/Toggle)**
_Use `useSharedValue` + `useAnimatedStyle` with `withTiming` or `withSpring` for reactive state changes._

- **APIs:** `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`

```tsx
import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
  ReduceMotion,
} from 'react-native-reanimated';
import { Animated } from '@/src/tw/animated';
import { motion } from '@/src/lib/animations/motion';

function ToggleBox({ isActive }: { isActive: boolean }) {
  const width = useSharedValue(100);
  const bgProgress = useSharedValue(0);

  useEffect(() => {
    width.set(
      withSpring(isActive ? 200 : 100, {
        reduceMotion: ReduceMotion.System,
      })
    );
    bgProgress.set(
      withTiming(isActive ? 1 : 0, {
        duration: motion.dur.md,
        reduceMotion: ReduceMotion.System,
      })
    );
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.get(),
    backgroundColor: interpolateColor(
      bgProgress.get(),
      [0, 1],
      ['#0000ff', '#ff0000']
    ),
  }));

  return <Animated.View style={animatedStyle} className="h-20 rounded-lg" />;
}
```

**2. Looping/Keyframe-Like Animations (Spinners, Skeletons)**
_Use `withRepeat` and `withSequence` for infinite or multi-step animations. Always use `cancelAnimation` for cleanup._

- **APIs:** `withRepeat`, `withSequence`, `cancelAnimation`

```tsx
function PulsingDot() {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.set(
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500, reduceMotion: ReduceMotion.System }),
          withTiming(1, { duration: 500, reduceMotion: ReduceMotion.System })
        ),
        -1,
        true
      )
    );
    return () => cancelAnimation(scale); // ⚠️ cleanup
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  return (
    <Animated.View style={style} className="size-4 rounded-full bg-primary" />
  );
}
```

**3. Layout Animations (Mount/Unmount)**
_List items, conditional rendering. Always wrap with `withRM` (from `src/lib/animations/motion`)._

- **APIs:** `FadeIn`, `ZoomOut`, `SlideInUp`, `LinearTransition`

```tsx
<Animated.View
  entering={withRM(FadeInUp.springify())}
  exiting={withRM(ZoomOut.duration(200))}
  layout={LinearTransition}
/>
```

**4. Shared Values (Interactive)**
_Gestures, Scroll, Sensors. The "Heavy Lifting"._

- **APIs:** `useSharedValue`, `useAnimatedStyle`, `Gesture` (RNGH v2), `GestureDetector`
- **Logic:** Keep math in worklets; avoid `scheduleOnRN` in `onUpdate`
- **Legacy Warning:** Never use `useAnimatedGestureHandler` (v1). Use `Gesture.Pan().onUpdate(...)` (v2)

```tsx
const offsetX = useSharedValue(0);
const offsetY = useSharedValue(0);
const startX = useSharedValue(0);
const startY = useSharedValue(0);
const gesture = Gesture.Pan()
  .onStart(() => {
    startX.set(offsetX.get());
    startY.set(offsetY.get());
  })
  .onUpdate((e) => {
    offsetX.set(startX.get() + e.translationX);
    offsetY.set(startY.get() + e.translationY);
  });
const style = useAnimatedStyle(() => ({
  transform: [{ translateX: offsetX.get() }, { translateY: offsetY.get() }],
}));
// <GestureDetector gesture={gesture}><Animated.View style={style} className="..." /></GestureDetector>
```

---

## 🔗 Shared element transitions

- Use `sharedTransitionTag` with a **prefixed domain**, e.g., `feed.card.image`, `settings.avatar`.
- Centralize optional `sharedTransitionStyle` in `src/lib/animations/shared.ts`.
- Name tags predictably; avoid collisions by prefixing with **feature**.

---

## 🖐️ Modern gestures (RNGH v2)

- Use the **`Gesture` builder API** with `GestureDetector`.
- Replace old `useAnimatedGestureHandler` (3.x) with `onStart/onUpdate/onEnd` chain.
- Keep your own shared `ctx` via `useSharedValue` if needed.
- Heavy math stays in **UI worklets**; no `scheduleOnRN` inside `onUpdate`.

---

## ♻️ Cleanup & chaining

- **Cancel** long/looping animations on unmount (`cancelAnimation`).
- Use composition helpers to chain sequences; fire follow‑up animations from finish callbacks.

---

## 🔀 Crossing threads

- **UI → JS**: `scheduleOnRN(fn, ...args)` only for side‑effects, analytics, or updating React state **after** animation/gesture.
- **JS → UI**: `scheduleOnUI(fn, ...args)` with a `useCallback` function reference.
- Keep boundaries **coarse‑grained**; never call `scheduleOnRN` per frame.

---

## 🚨 Pitfalls (4.x)

1. Calling **React hooks** inside worklets (don’t).
2. Reading `.value` (use `.get()`) or writing `.value =` (use `.set()`) — breaks React Compiler.
3. Large closure captures; prefer primitives/params/shared values.
4. Per‑frame `className` churn; derive styles from shared values.
5. Multiple writes to the same shared value in one frame.
6. Forgetting `cancelAnimation` on long/looping sequences.
7. Overusing `scheduleOnRN` in `onUpdate` handlers.

---

## 🧱 Motion tokens & Reduced Motion (Esco Beach Club)

- Centralize **durations**, **easings**, and **spring presets** so animations feel consistent.

```ts
// src/lib/animations/motion.ts — see actual file for full types
export const motion = {
  dur: { xs: 120, sm: 180, md: 260, lg: 360, xl: 600 },
  ease: { standard: Easing.bezier(0.2,0,0,1), decel: Easing.bezier(0,0,0.2,1) },
  spring: {
    gentle:  { damping: 15, stiffness: 120, reduceMotion: ReduceMotion.System },
    bouncy:  { damping: 12, stiffness: 180, reduceMotion: ReduceMotion.System },
    stiff:   { damping: 15, stiffness: 200, reduceMotion: ReduceMotion.System },
    snappy:  { damping: 15, stiffness: 300, reduceMotion: ReduceMotion.System },
  },
};
export function rmTiming(dur: number) { return { duration: dur, reduceMotion: ReduceMotion.System }; }
export const withRM = (anim) => /* applies ReduceMotion.System — see file for typed impl */;
```

**Use:** `entering={withRM(FadeInUp.duration(motion.dur.md))}` — `withRM` ensures Reduced Motion is respected.

## 🤝 Gesture composition (cheat)

- `Gesture.Simultaneous(pan, pinch)` — both can run.
- `Gesture.Exclusive(press, pan)` — press wins unless pan exceeds threshold.
- `Gesture.Race(longPress, tap)` — first to activate cancels others.

> Heavy math stays in `onUpdate` worklets; use `scheduleOnRN` only in `onEnd`.

## 🧭 Scroll recipe (programmatic)

```ts
const scrollRef = useAnimatedRef<Animated.ScrollView>();
scrollTo(scrollRef, 0, y.get(), true);
```

- Prefer `scrollTo` over style/position hacks; keep `y` as a shared value.

## 🏷️ Shared values naming (Esco Beach Club)

- Prefix with **feature** + **unit**: `feedY`, `cardScale`, `opacityA`.
- Derived values suffix `D`: `cardScaleD` derived from `cardScale`.

## ✅ QA checklist (ultra‑short)

- Reduced Motion respected everywhere?
- List insert/remove uses `layout` and looks smooth?
- Any per‑frame `scheduleOnRN` or class churn left?
- Looping animations canceled on unmount?
- Style keys stable per frame; compute once in `useDerivedValue`, reuse across styles.

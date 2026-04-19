---
name: android polish build
overview: Apply additive Android improvements (adaptive/themed icon, notifications icon/color, explicit edge-to-edge, release-build size/privacy flags via expo-build-properties, and Android 14 predictive back gesture) before the next native build. All changes are additive and do not alter iOS behavior.
todos:
  - id: assets
    content: Generate white-on-transparent monochrome and notification icon PNGs from existing brand assets
    status: completed
  - id: app-json-android
    content: 'Update app.json android block: add monochromeImage, edgeToEdgeEnabled, allowBackup: false'
    status: completed
  - id: notif-plugin
    content: Convert expo-notifications plugin entry to object form with icon + brand color
    status: completed
  - id: build-properties
    content: Install expo-build-properties and add plugin with ProGuard, resource shrinking, and predictive back gesture
    status: completed
  - id: verify
    content: Run type-check and expo-doctor; confirm no regressions before new build
    status: completed
isProject: false
---

## Scope

Tiers 1–3 from the audit, including creating Android-only icon assets. No iOS-visible changes. All edits are config-level plus two new asset files; no component code changes except optional verification of [app/\_layout.tsx](app/_layout.tsx) `SystemUI.setBackgroundColorAsync` still runs cleanly with edge-to-edge explicitly on.

## 1. Android icon assets (create)

Derive two new assets from the existing foreground:

- `assets/android-icon-monochrome.png` — white-on-transparent silhouette of the logo, 1024x1024, safe zone 66% (Android 13+ themed icons mask and tint this).
- `assets/notification-icon.png` — white-on-transparent silhouette, 96x96 (mdpi baseline; Android scales for hdpi/xxhdpi). Keep it simple: small marks render as a blob, so a single bold glyph.

Both must be pure white (#FFFFFF) on transparent, no gradients, no color — the OS tints them.

## 2. `app.json` changes

In `android`:

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "assets/android-icon.png",
    "backgroundColor": "#ffffff",
    "monochromeImage": "assets/android-icon-monochrome.png"
  },
  "edgeToEdgeEnabled": true,
  "allowBackup": false,
  "permissions": [ ...existing ],
  "package": "com.escobeachclub.app"
}
```

Update the `expo-notifications` plugin entry (currently the bare string `"expo-notifications"`) to:

```json
[
  "expo-notifications",
  {
    "icon": "./assets/notification-icon.png",
    "color": "#C9A24B"
  }
]
```

Use the brand primary you already use in the tab bar — confirm the exact hex from `[constants/colors.ts](constants/colors.ts)` during edit.

## 3. Add `expo-build-properties` plugin

Install with `bunx expo install expo-build-properties`, then append to `plugins` in [app.json](app.json):

```json
[
  "expo-build-properties",
  {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true,
      "enablePredictiveBackGesture": true
    }
  }
]
```

Notes:

- ProGuard + resource shrinking only apply to release variants, so dev/preview remain fast.
- Predictive back requires `react-native-screens` ≥ 4 (you're on `~4.23.0`, fine) and an opt-in flag in `AndroidManifest.xml` which the plugin sets automatically.

## 4. Verification before building

- `bun run type-check` — sanity check nothing else regressed.
- `bun run doctor` (`expo install --check && expo-doctor`) — confirms new plugin versions line up with SDK 55.
- Manual check of [app/\_layout.tsx](app/_layout.tsx) — no code change needed; `EscoNavigationTheme` already calls `SystemUI.setBackgroundColorAsync` on Android, which is the right complement to explicit edge-to-edge.
- Post-build smoke test checklist: back-swipe in stacks (predictive back peek), tab bar still renders behind system bars correctly, notification appears with colored brand icon, themed icon shows on a Pixel with "themed icons" enabled.

## Files touched

- [app.json](app.json) — android block, `expo-notifications` plugin, add `expo-build-properties` plugin.
- `package.json` / lockfile — via `bunx expo install expo-build-properties`.
- New: `assets/android-icon-monochrome.png`, `assets/notification-icon.png`.

## Out of scope (deferred)

- Tier 4 ripple pass on custom `Pressable`s — noted for a later polish PR.
- Splash `resizeMode: "native"` — keeps wordmark launch for now.

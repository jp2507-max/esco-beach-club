# Esco Beach Club MVP

Members-only lifestyle app for curated events, partner perks, loyalty experiences, and premium member flows.

## Current stack

- Expo SDK 55 + React Native 0.83
- Expo Router (typed routes enabled)
- TypeScript
- Uniwind (Tailwind CSS v4 runtime)
- React Compiler + Reanimated 4 + Worklets
- InstantDB (`@instantdb/react-native`) with MMKV persistence (`@instantdb/react-native-mmkv`)
- TanStack Query + Zustand
- FlashList + `expo-image`

## Runtime requirements

- Node.js 20+
- Bun
- Xcode (iOS) and/or Android Studio (Android)

## Environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_INSTANT_APP_ID=your_instant_app_id

# Optional (runtime SDK)
EXPO_PUBLIC_SENTRY_DSN=

# Required for EAS Build/Update sourcemap upload (do not commit real value)
SENTRY_AUTH_TOKEN=
```

`EXPO_PUBLIC_INSTANT_APP_ID` is required at runtime by `src/lib/instant.ts`.

## Local development (native)

Because MMKV is used for auth/session persistence, run this project with a custom native build (not Expo Go).

1. Install dependencies

```bash
bun install
```

2. Generate native projects

```bash
bunx expo prebuild
```

3. Run the app

```bash
bunx expo run:ios
# or
bunx expo run:android
```

4. Start Metro for subsequent launches

```bash
bun run start
```

## NPM/Bun scripts

```bash
bun run start
bun run start-web
bun run start-web-dev
bun run lint
```

## App architecture snapshot

### Routing

- `app/(auth)` → magic-code auth screens (`login`, `signup`)
- `app/(tabs)` → authenticated tab shell (`home`, `events`, `perks`, `profile`)
- `app/(shared)` → shared push screens (e.g. `events/[id]`)
- `app/(modals)` → modal flows (`booking`, `partner`, `private-event`, `rate-us`)

Auth gating is handled in `app/_layout.tsx` using `Stack.Protected` and `useAuth()`.

### Data/auth layers

- `src/lib/instant.ts` initializes InstantDB with MMKV store.
- `providers/AuthProvider.tsx` implements Instant magic-code auth:
  - `db.auth.sendMagicCode`
  - `db.auth.signInWithMagicCode`
  - `db.auth.signOut`
- `providers/DataProvider.tsx` currently keeps app content on mocked data while auth is real.

### Instant schema and permissions

- `instant.schema.ts` → entity schema source of truth
- `instant.perms.ts` → permission rules source of truth

## Project structure

```text
app/                Expo Router routes
assets/             Images and static assets
constants/          Shared constants (color tokens, etc.)
instant.schema.ts   InstantDB schema
instant.perms.ts    InstantDB permissions
lib/                Shared app types/helpers
mocks/              Mock content used by DataProvider
providers/          Auth + data providers
src/                UI wrappers, forms, animations, Instant client
```

## Instant CLI workflow (optional)

```bash
npx instant-cli@latest login
npx instant-cli@latest push schema
npx instant-cli@latest push perms
npx instant-cli@latest pull
```

## Build & release

EAS build profiles are defined in `eas.json`:

- `development` (dev client, internal distribution)
- `preview` (internal distribution)
- `production` (auto increment enabled)

Examples:

```bash
bunx eas-cli build --profile development --platform ios
bunx eas-cli build --profile preview --platform android
bunx eas-cli build --profile production --platform all
```

### Sentry sourcemaps

- Native release builds upload sourcemaps automatically when `SENTRY_AUTH_TOKEN` is available in your build environment.
- For OTA updates, run sourcemap upload after `eas update`:

```bash
npx sentry-expo-upload-sourcemaps dist
```

### Sentry quick setup checklist

1. Ensure `EXPO_PUBLIC_SENTRY_DSN` is set in local `.env` (runtime SDK init).
2. Ensure `SENTRY_AUTH_TOKEN` is set in EAS project secrets for build/update environments.
3. Build a release profile once (`preview` or `production`) and verify a test error appears symbolicated in Sentry.
4. For OTA updates, run `eas update`, then upload update sourcemaps:

```bash
bun run sentry:upload-sourcemaps
```

5. Confirm Sentry event tags include update metadata (`expo-update-id`, `expo-update-group-id`, `expo-update-debug-url`).

## Invite & Earn (referrals)

- **Deep links**: `esco-beach-club://invite/<CODE>` and `https://escolife.app/invite/<CODE>` (universal links require Apple/Google verification + hosting `apple-app-site-association` / Digital Asset Links).
- **Client env**: `EXPO_PUBLIC_REFERRAL_API_BASE_URL` — base URL where Expo Router serves API routes (e.g. production web/API host). In dev, the app falls back to `http://<metro-host>:8081` when `hostUri` is available.
- **Server secrets** (never ship to the client): `INSTANT_APP_ADMIN_TOKEN` — Instant dashboard admin token; optional `INSTANT_APP_ID` if you do not want to reuse `EXPO_PUBLIC_INSTANT_APP_ID` on the server.
- **API routes**: `POST /api/referrals/claim` (body: `referralCode`, `refreshToken`) creates a pending referral for the signed-in user; `POST /api/referrals/complete` (`Authorization: Bearer <refreshToken>`, body: `referralId`) marks a referral completed for active staff/manager in `staff_access`.
- **Schema**: after pulling changes, run `npx instant-cli@latest push schema` so `referrals.referee_profile_id` exists in production.

## App identifiers

- Slug: `escolife`
- Deep link scheme: `esco-beach-club`
- iOS bundle id: `com.escobeachclub.app`
- Android package: `com.escobeachclub.app`

## Troubleshooting

- **`Missing EXPO_PUBLIC_INSTANT_APP_ID`**
  - Ensure `.env` exists and contains `EXPO_PUBLIC_INSTANT_APP_ID`.
- **Native module errors after dependency changes**
  - Re-run `bunx expo prebuild`, then rebuild with `bunx expo run:ios` or `bunx expo run:android`.
- **Lint check**
  - Run `bun run lint`.

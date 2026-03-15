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

# Optional
EXPO_PUBLIC_SENTRY_DSN=
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
eas build --profile development --platform ios
eas build --profile preview --platform android
eas build --profile production --platform all
```

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

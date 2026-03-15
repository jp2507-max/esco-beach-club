---
name: instantdb mmkv setup
overview: Set up InstantDB on the current Expo 55 / React Native 0.83 app using MMKV-backed persistence, replace the legacy AsyncStorage/Supabase auth path, and convert the existing login shell to Instant magic-code auth while leaving the broader mock content layer in place for now.
todos:
  - id: deps-and-bootstrap
    content: Add InstantDB + MMKV dependencies, bootstrap the client/schema/perms files, and switch root app setup to the new Instant client path.
    status: pending
  - id: auth-migration
    content: Replace the mock/password auth provider with Instant magic-code auth and align route guarding with Instant auth state.
    status: pending
  - id: ui-alignment
    content: Update login/signup screens to match the email + verification code flow without migrating the full data model yet.
    status: pending
  - id: docs-cleanup
    content: Remove or retire the old Supabase/AsyncStorage setup and update docs/env guidance for MMKV + Instant dev builds.
    status: pending
isProject: false
---

# InstantDB MMKV Setup Plan

## Scope

This pass will:

- Set up InstantDB using the current recommended React Native stack: `@instantdb/react-native` plus `@instantdb/react-native-mmkv`.
- Use MMKV instead of AsyncStorage for Instant’s local persistence.
- Replace the current mock password auth flow with Instant magic-code auth.
- Keep the existing mock content layer in `[providers/DataProvider.tsx](c:\Users\Peter\esco-beach-club\providers\DataProvider.tsx)` for now, so screens continue working while backend entities are migrated later.

This pass will not yet:

- Move `profile`, `events`, `partners`, `referrals`, `reviews`, or `private events` into Instant entities.
- Push a production schema/perms unless you want that in a later step.

## Latest Stack Findings

Based on current Instant docs and package guidance checked via Exa Search + Context7:

- Instant React Native setup uses `@instantdb/react-native`.
- MMKV persistence uses `@instantdb/react-native-mmkv` with `react-native-mmkv` and `react-native-nitro-modules`.
- MMKV requires native code, so Expo Go is no longer sufficient; we need `expo prebuild` and a custom dev build / `expo run:*` workflow.
- Instant’s recommended client auth for this setup is magic code (`sendMagicCode`, `signInWithMagicCode`), not client-side email/password auth.

## Planned Changes

### 1. Replace the old backend/persistence path

Touch:

- `[package.json](c:\Users\Peter\esco-beach-club\package.json)`
- `[lib/supabase.ts](c:\Users\Peter\esco-beach-club\lib\supabase.ts)`
- `[README.md](c:\Users\Peter\esco-beach-club\README.md)`

Work:

- Add InstantDB + MMKV packages and the required React Native peers.
- Remove the active dependency on `@react-native-async-storage/async-storage` from the app path if it becomes unused.
- Retire the Supabase client file or replace it with the new Instant entry point so there is only one blessed data/auth path.
- Update docs to say the app now requires a native dev build because MMKV is in use.

Why this is necessary:

- `[lib/supabase.ts](c:\Users\Peter\esco-beach-club\lib\supabase.ts)` currently persists auth through AsyncStorage, which conflicts with your requirement.

### 2. Add the Instant foundation files

Touch:

- `[instant.schema.ts](c:\Users\Peter\esco-beach-club\instant.schema.ts)`
- `[instant.perms.ts](c:\Users\Peter\esco-beach-club\instant.perms.ts)`
- `[src/lib/instant.ts](c:\Users\Peter\esco-beach-club\src\lib\instant.ts)`
- existing env type file such as `[global.d.ts](c:\Users\Peter\esco-beach-club\global.d.ts)`

Work:

- Create a minimal schema/perms baseline suitable for the app shell and future migration.
- Initialize `db` with `appId`, `schema`, and `Store` from `@instantdb/react-native-mmkv`.
- Add typed env support for `EXPO_PUBLIC_INSTANT_APP_ID`.
- Add any one-time React Native polyfill/bootstrap import Instant requires.

Implementation shape:

```ts
import { init } from '@instantdb/react-native';
import Store from '@instantdb/react-native-mmkv';
import schema from '@/instant.schema';

export const db = init({
  appId: process.env.EXPO_PUBLIC_INSTANT_APP_ID!,
  schema,
  Store,
});
```

### 3. Migrate auth provider and route guard

Touch:

- `[providers/AuthProvider.tsx](c:\Users\Peter\esco-beach-club\providers\AuthProvider.tsx)`
- `[app/_layout.tsx](c:\Users\Peter\esco-beach-club\app\_layout.tsx)`
- `[providers/DataProvider.tsx](c:\Users\Peter\esco-beach-club\providers\DataProvider.tsx)`

Work:

- Rebuild `AuthProvider` around Instant auth state instead of local mock session state.
- Expose an auth API that matches the app shell but maps to Instant methods: send code, verify code, sign out, loading, user, isAuthenticated.
- Update the root auth gate to rely on Instant auth loading/user state.
- Keep `DataProvider` mock-backed, but source `userId` from the Instant user so the rest of the app can keep functioning without a full entity migration.

### 4. Convert login/signup UI to magic-code flow

Touch:

- `[app/login.tsx](c:\Users\Peter\esco-beach-club\app\login.tsx)`
- `[app/signup.tsx](c:\Users\Peter\esco-beach-club\app\signup.tsx)`

Work:

- Replace password submission with a 2-step email/code flow.
- Reuse the existing polished screen shell where possible, but change form fields and provider calls to Instant magic-code methods.
- Decide whether `signup` becomes a thin alias to `login` or a branded first-step screen that leads into the same code verification flow.

### 5. Keep the rest of the app stable

Touch:

- `[app/(tabs)/profile.tsx](c:\Users\Peter\esco-beach-club\app\(tabs)`\profile.tsx)
- any screens that rely on `userId` only, such as `[app/rate-us.tsx](c:\Users\Peter\esco-beach-club\app\rate-us.tsx)` and `[app/private-event.tsx](c:\Users\Peter\esco-beach-club\app\private-event.tsx)`

Work:

- Verify that current screens still work against the mock `DataProvider` after auth is swapped.
- Keep the mock API layer in place for non-auth data so this stays an infra-first migration instead of a schema migration.

## Acceptance Checks

- App initializes Instant through `[src/lib/instant.ts](c:\Users\Peter\esco-beach-club\src\lib\instant.ts)` with MMKV store configured.
- No active auth path still depends on AsyncStorage/Supabase.
- Login works through Instant magic code flow.
- Existing route guard in `[app/_layout.tsx](c:\Users\Peter\esco-beach-club\app\_layout.tsx)` respects real auth state.
- The rest of the tabs still render using the mock data layer.
- README reflects the new env var and native dev build requirement.

i already created a instantdb project if this sis helpful: escolife --app 9c3142a0-8d34-40f4-9d93-97cd601a016d --token 895b6982-9020-4099-b0f3-de10377862c8 --expo --rules
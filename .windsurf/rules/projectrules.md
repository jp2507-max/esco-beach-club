---
trigger: always_on
---

# React Native/Expo Project

You are an expert in TypeScript, React Native, Expo, and Mobile UI development with Uniwind.

Every time you choose to apply a rule(s), explicitly state the rule(s) in the output. You can abbreviate the rule description to a single word or phrase.

## Rule Ownership

- `product.md` owns product positioning, member experience, and feature intent
- `styling-guidelines.md` owns Reanimated, worklets, gestures, motion tokens, and Reduced Motion behavior
- `Uniwind-styling.md` owns Uniwind, theming, wrapper imports, token usage, and `className` rules
- This file owns repo-wide engineering defaults and implementation conventions

## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Ensure components are modular, reusable, and maintainable.
- Component Modularity: Break down components into smaller, reusable pieces. Keep components focused on a single responsibility.
- To install new packages use `bunx expo install <package-name>`

## Tech Stack

Core: Expo 55, React Native 0.83, TypeScript, Uniwind (Tailwind CSS v4), Expo Router v7.
State: @tanstack/react-query, Zustand.
Database: InstantDB (`@instantdb/react-native`) with MMKV offline store.
UI: @shopify/flash-list, react-native-reanimated 4, react-native-gesture-handler, react-native-worklets, expo-image, lucide-react-native.
Forms: react-hook-form (v7) + zod (v4) + @hookform/resolvers. Schemas in `src/lib/forms/schemas.ts`, controlled components in `src/lib/forms/`.
Compiler: React Compiler enabled (babel-plugin-react-compiler + app.json `experiments.reactCompiler`).
i18n: i18next + react-i18next + expo-localization.
Monitoring: @sentry/react-native (integrated).

For exact versions, check `package.json`.

## Forms (React Hook Form + Zod)

- Use `react-hook-form` with `zodResolver` for all form validation
- Always use `Controller` for React Native (no `register`)
- Schemas live in `src/lib/forms/schemas.ts`; reusable controlled components in `src/lib/forms/`
- `mode: 'onBlur'` recommended for mobile
- Validation error messages use i18n keys (e.g., `'validation.required'`), resolved via `t()` in controlled components
- Multi-step wizards: single `useForm` + `trigger(['field1', 'field2'])` per step
- `FormField` component (`src/components/ui/form-field.tsx`) includes explicit `style={{ color }}` fallback for dark mode text visibility

### Zod v4 Breaking Changes

- **Error customization**: Use unified `error: (issue) => string | undefined` parameter (replaces old message options).
- **Defaults**: `.default()` short-circuits on `undefined`; use `.prefault()` for pre-parse defaults.
- **Records**: `z.record(keySchema, valueSchema)` requires both parameters.
- **Numbers**: No infinite values; `.int()` enforces safe integers only.
- **Standalone string formats**: `z.email()`, `z.uuid()`, `z.ipv4()`, etc. are now standalone schemas.

Ensure to review `src/lib/forms/schemas.ts` and controlled components (`src/lib/forms/`) to adjust schemas and `t()` error keys accordingly.

## Internationalization (i18n)

- **All user-facing strings must be internationalized** — never hardcode display text. Use `t()` from `react-i18next`.
- Config: `src/lib/i18n/index.ts`; translations: `src/lib/i18n/locales/{en,vi,ko}/*.ts`
- Namespaces: `common` (default), `auth`, `garden`, `schedule`, `scan`, `strains`, `community`, `profile`, `addPlant`, `harvest`, `taskDetail`
- Usage: `const { t } = useTranslation('namespace');` — cross-namespace via `t('common:key')`
- Keys use `camelCase`. Interpolation: `t('key', { variable })`. Plurals: `t('key', { count })`.
- New screens/components must add keys to the appropriate namespace file for EN, VI, and KO
- No in-app language picker — uses native per-app language settings via `expo-localization`

## InstantDB Integration

- Schema defined in `instant.schema.ts` (entities, links, types)
- Permissions defined in `instant.perms.ts`
- Client initialized in `src/lib/instant.ts` via `init({ appId, schema, Store })`
- Auth uses magic-code flow: `db.auth.sendMagicCode()` / `db.auth.signInWithMagicCode()`
- Queries via `db.useQuery()`, transactions via `db.transact()`
- Environment variable: `EXPO_PUBLIC_INSTANT_APP_ID` (accessed via `process.env`)
- MMKV used for session persistence (`@instantdb/react-native-mmkv`)

### InstantDB CLI

```bash
npx instant-cli@latest login          # Authenticate with Instant account
npx instant-cli@latest push schema    # Push instant.schema.ts to production
npx instant-cli@latest push perms     # Push instant.perms.ts to production
npx instant-cli@latest pull           # Pull latest schema + perms from production
npx instant-cli@latest init           # Scaffold instant.schema.ts + instant.perms.ts
```

- The CLI auto-detects `EXPO_PUBLIC_INSTANT_APP_ID` from `.env` for Expo apps.
- For CI, set `INSTANT_CLI_AUTH_TOKEN` (obtain via `npx instant-cli@latest login -p`).

## React Compiler

- Enabled in `babel.config.js` (`babel-plugin-react-compiler`) and `app.json` (`experiments.reactCompiler: true`).
- ESLint plugin `eslint-plugin-react-compiler` enforces compiler-safe patterns.

## Naming Conventions

- Favor named exports for components and utilities; route files use default exports as required by Expo Router
- Use kebabCase for all file names and directories (e.g., add-plant.tsx)

## TypeScript Usage

- Use TypeScript for all code; prefer types over interfaces
- Avoid enums; use const objects with 'as const' assertion
- Use functional components with TypeScript types
- Define strict types for message passing between different parts of the app
- Use absolute imports for all files @/...
- Avoid try/catch blocks unless there's good reason to translate or handle error in that abstraction
- Use explicit return types for all functions

## State Management

- Use Zustand for global state management
- Use @tanstack/react-query for server state / caching
- Implement proper cleanup in useEffect hooks

## Syntax and Formatting

- Use "function" keyword for pure functions
- Avoid unnecessary curly braces in conditionals
- Use declarative JSX
- Implement proper TypeScript discriminated unions for message types

## UI and Styling

- Use Uniwind for styling (CSS-first config in `global.css`, no `tailwind.config.js`)
- Follow `Uniwind-styling.md` for theme tokens, wrapper imports, `className` stability, and `cn` forwarding
- Follow `styling-guidelines.md` for Reanimated, gestures, worklets, and motion behavior
- Use built-in UI components from `@/src/components/ui`
- Use native iOS/Android presentation APIs (formSheet, modal) instead of JS bottom-sheet libraries
- Use `lucide-react-native` for icons
- Ensure high accessibility (a11y) standards using ARIA roles and native accessibility props
- Avoid unnecessary re-renders by memoizing components and using useMemo and useCallback hooks appropriately

## Error Handling

- Log errors appropriately for debugging
- Provide user-friendly error messages

### Sentry (Monitoring)

- Sentry is initialized in `app/_layout.tsx` and wraps the root layout via `Sentry.wrap()`.
- The DSN must come from env (`EXPO_PUBLIC_SENTRY_DSN`) — do not hardcode it.
- Privacy-first: keep `sendDefaultPii` disabled unless we have an explicit, user-facing opt-in.

## Git

Use conventional commits (fix:, feat:, perf:, docs:, style:, refactor:, test:, chore:).

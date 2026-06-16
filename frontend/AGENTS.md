# frontend/ — Expo app (agent guide)

Expo SDK **56** + expo-router. The Dream Catcher dream journal, "celestial almanac" art direction.

## Expo has changed — read the versioned docs
Before writing Expo/RN code, consult the exact versioned docs: https://docs.expo.dev/versions/v56.0.0/. APIs differ from older SDKs.

## Verify
```sh
npx tsc --noEmit                    # from frontend/
npx expo export --platform web      # statically renders every route = full module-graph + render check
```

## Design system (this is the brand — preserve it)
- All almanac primitives live in `src/components/almanac/` (MoonPhase/MoonPlate, Icon, TagChip, MoodScale, Btn, Surface, Fleuron, CatalogLabel, DropCap, Screen, PushBar, feed bits). Reuse them; don't reinvent.
- **Colors come from `useTheme().c`** (a resolved `Palette`); **fonts from `useTheme().fonts`**. Never hardcode hex.
- **`src/theme/tokens.ts` is GENERATED — never hand-edit.** It's produced from the OKLCH design spec by `scripts/gen-tokens.mjs` (RN has no `oklch`/`color-mix`). To change colors, edit the script and rerun `node scripts/gen-tokens.mjs`.
- Display font Marcellus, body Spectral (italic/semibold are separate families — RN doesn't synthesize). Loaded in `src/app/_layout.tsx` + `app.json` expo-font plugin.
- Known RN approximations (intentional): drop cap is a raised inline initial (no float); dotted leaders may render solid on iOS.

## Navigation
expo-router. Root `Stack` in `app/_layout.tsx`; tabs in `app/(tabs)/` with a **custom dock** tab bar (`app/(tabs)/_layout.tsx`) — not the default tab bar. Pushed detail routes: `dream/[id]`, `symbol/[tag]`, `reading/[id]`; `record` is a modal. State: `DreamsProvider` (in-memory, sample-seeded) + `ThemeProvider`.

## Auth (backend broker in `../backend`, infra in `../infra`)
Full picture (why no client SDK, endpoint contract, session lifecycle, security model): `../docs/authentication.md`.
The app holds **no Cognito SDK and no native crypto** — it only `fetch()`es our `/auth/*` broker (Cognito SRP/secure-random doesn't work on Expo; the backend does the Cognito calls). `src/auth/`: `config.ts` (public API base + Cognito ids), `api.ts` (the fetch client — signUp/confirm/resend/signIn/forgot/refresh/social; throws `Error` whose `name` is the backend `code`), `storage.ts` (session in `expo-secure-store`, one key per token for the ~2KB iOS limit), `errors.ts` (`code` → in-voice copy), and `auth-provider.tsx` (`useAuth()` → status/user + the actions; hydrates + refreshes on launch).
- **Email/password works in Expo Go and production** (just fetch — no native modules). It returns a session `{ tokens, user, expiresAt }`.
- **Native social** (Apple/Google) gets a provider idToken on-device, then `signInWithSocial(provider, idToken)` brokers it via `/auth/social`. Needs real client IDs + native config (`ios.bundleIdentifier`, the apple plugin, the google `iosUrlScheme`) + an **EAS dev build** (native SDKs don't run in Expo Go).
- AI readings still use offline fallbacks (`src/ai/dream-ai.ts`, `callLLM` stubbed).
- **Known follow-up — refresh is launch-only.** `auth-provider.tsx` refreshes an expired session *only* during the on-launch hydrate, and `expiresAt` is `now + expiresIn` snapshotted at save time (device-clock based, not the token's real `exp`). This is fine today because nothing makes authenticated calls (AI is offline-stubbed). **Before adding the first authed request**, route every token read through a shared `getValidSession()` that refreshes on the skew window *and* on a 401, and signs out on an unrecoverable refresh — don't special-case refresh at the call site.

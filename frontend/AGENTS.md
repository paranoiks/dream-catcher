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

## Auth (in progress — backend in `../infra` + `../backend`)
Native SDKs (`expo-apple-authentication`, `@react-native-google-signin`) + Cognito SRP for email/pass. **These native modules require an EAS dev build — they don't run in Expo Go.** AI readings currently use offline fallbacks (`src/ai/dream-ai.ts`, `callLLM` stubbed).

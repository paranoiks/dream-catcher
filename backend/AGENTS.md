# backend/ — auth Lambdas (agent guide)

TypeScript Lambdas for Cognito-backed auth. Bundled with esbuild, deployed by Terraform in `infra/`.

## Verify (always run before considering a change done)
```sh
npm --prefix backend run typecheck   # tsc --noEmit
npm --prefix backend run build        # esbuild -> dist/<name>/index.js
```

## Auth model (do not "simplify" away the invariants)
- **Email/password is NOT handled here.** The app does it client-side via Cognito SRP. No endpoint, no password ever reaching a server.
- **Social (`POST /auth/social`)**: verify the provider `idToken` (`lib/verify.ts`, jose + provider JWKS, checks `aud`/`iss`/`exp`) → `findOrCreateUser` → `issueTokens` (`lib/cognito.ts`).
- **Token minting uses a `CUSTOM_AUTH` shared-secret challenge**, NOT a password. The broker answers the Cognito challenge with `CHALLENGE_SECRET`; the `custom-auth` trigger (`handlers/custom-auth.ts`, one Lambda for all three trigger sources) gates on it.
  - **Why:** lets the broker mint tokens for a social user without knowing/owning a password, and **never touches an existing email/password user's credentials**. A random password is set on a social user **only at creation** (to reach `CONFIRMED`) — never on a user that already exists.
- **Only a provider-VERIFIED email may create or match an account** (`identity.emailVerified` must be true). An unverified email never links — this closes the `email_verified`-bypass account-takeover class. The challenge secret is compared with `crypto.timingSafeEqual`. jose failures are classified via `isTokenError` (`instanceof errors.JOSEError`) → 401, not 500.

## Sharp edges
- **Apple returns `email` only on first authorization.** First login: create keyed by email, store `preferred_username = "<provider>_<sub>"`. Returning Apple login (no email): look up via `ListUsers` filter on `preferred_username` (custom attrs are NOT filterable — that's why we use `preferred_username`).
- **Relative imports are extensionless** (`from '../lib/verify'`). esbuild does not map `.js`→`.ts`; tsc `moduleResolution: bundler` is happy without extensions.
- **`@aws-sdk/*` is `external`** in `esbuild.mjs` (provided by the `nodejs20.x` runtime). `jose` is bundled. Don't add SDK calls expecting a different SDK version than the runtime's.
- Handler export is `index.handler` (set by esbuild outfile + Terraform `handler`).

## Env contract (set by Terraform `infra/lambda.tf`)
`social`: `USER_POOL_ID`, `CLIENT_ID`, `CHALLENGE_SECRET`, `GOOGLE_CLIENT_IDS` (csv), `APPLE_AUDIENCES` (csv).
`custom-auth`: `CHALLENGE_SECRET`.

## Adding a handler
Add an entry to `handlers` in `esbuild.mjs`, create `src/handlers/<name>.ts`, then wire the function + IAM + trigger/route in `infra/`.

## Known follow-ups (do when building frontend auth)
- **Nonce binding (replay protection):** `verify.ts` checks `aud`/`iss`/`exp` but not a nonce. The native app should generate a nonce, embed it in the Apple/Google auth request, send it alongside the idToken, and the broker should verify the token's `nonce` claim — binds a token to one auth request so a captured/same-audience token can't be replayed.
- **Apple email-only-first-time:** Apple returns the email only on the *first* authorization (in the credential, not later idTokens). The client must capture and forward it on that first call, or a reinstall yields a token with no email → `NoAccountForToken` (401). The no-email path only resolves accounts already bound to `preferred_username = "<provider>_<sub>"`.

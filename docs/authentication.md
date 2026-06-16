# Authentication

Deep reference for Dream Catcher's auth system. The **operational** layer — invariants,
"don't do X", and verify commands — lives in the per-area `AGENTS.md` files
(`backend/`, `frontend/`, `infra/`). This file is the **why** and the **full contract**:
read it before you change the auth model, not before a one-line tweak.

## TL;DR

One **Cognito** user pool is the identity directory. The device never calls Cognito
directly — it `fetch()`es our **`/auth/*` broker** Lambdas, which make the Cognito calls.
So there is **no Cognito SDK, no native crypto, and no hosted login UI** on the device,
for both email/password and native Apple/Google.

## Why a broker (the decision, so nobody re-litigates it)

The obvious path — the AWS client SDK on the device — does not work on Expo, and the
workarounds are each worse than the broker:

- **`amazon-cognito-identity-js` / Cognito SRP can't run on Expo SDK 56.** Its
  `AuthenticationHelper` constructor unconditionally generates secure random via the
  legacy native module `ExpoRandom.getRandomBase64String` — even on the
  `USER_PASSWORD_AUTH` path that doesn't use SRP. SDK 56 removed that module, and it
  can't be shimmed (`NativeModules` is read-only under the new architecture). Result:
  an insecure-RNG warning in dev and a **hard crash in production**. `global.crypto.getRandomValues` does **not** satisfy it.
- **Amplify v6 — rejected.** Same native-crypto dependency; it drops Expo Go entirely
  and requires a prebuild/EAS dev build. We'd lose fast iteration for the same root cause.
- **`patch-package` — rejected.** The crypto module is genuinely *absent*, not buggy, so
  there's nothing to patch cleanly; and carrying a patch for a dependency AWS isn't going
  to fix soon is permanent maintenance debt.
- **Cognito Hosted UI — rejected on design grounds.** A redirect to an AWS-hosted
  "allow APP to connect" screen breaks the "celestial almanac" immersion. Removing that
  break is the whole reason we left Auth0 — reintroducing it defeats the brand. **Do not
  add Hosted UI.**

The broker moves every Cognito call server-side, where Node has real crypto. The device
speaks plain JSON. This is a deliberate, load-bearing constraint, not an accident.

## Components

```
Device  frontend/src/auth/
          config.ts          public API base + Cognito ids (source of truth for values)
          api.ts             fetch client; throws Error whose .name is the backend `code`
          auth-provider.tsx  useAuth(): status/user + actions; hydrates + refreshes on launch
          storage.ts         session in expo-secure-store (one key per token; ~2KB iOS limit)
          errors.ts          `code` -> in-voice copy
          types.ts           AuthTokens / AuthUser / Session / Provider

Broker  backend/src/handlers/
          email-auth.ts      ONE Lambda, routed by event.routeKey (7 email/password routes)
          social.ts          POST /auth/social (native Apple/Google idToken -> session)
          custom-auth.ts     Cognito trigger (the CUSTOM_AUTH shared-secret challenge)
        backend/src/lib/
          respond.ts         json(), sessionFrom(), errorResponse() (Cognito error -> status/code)
          verify.ts          provider idToken verification (jose + JWKS; aud/iss/exp)
          cognito.ts         findOrCreateUser / issueTokens

Cognito one user pool; app client allows USER_PASSWORD_AUTH, CUSTOM_AUTH, REFRESH_TOKEN_AUTH
Infra   infra/{cognito,lambda,apigw}.tf   pool + client, the broker Lambdas + IAM, the HTTP API routes
```

Flow (email/password sign-in):

```
device api.signIn(email,password)
  -> POST /auth/login                (HTTP API, no client secret)
  -> email-auth Lambda: InitiateAuth USER_PASSWORD_AUTH
  -> Cognito returns AuthenticationResult
  -> respond.sessionFrom(): { idToken, accessToken, refreshToken, expiresIn, user }
  -> device toSession(): { tokens, user, expiresAt } -> SecureStore -> status 'signedIn'
```

Flow (native social): the app obtains a provider idToken on-device, then
`signInWithSocial(provider, idToken)` -> `POST /auth/social` -> the broker **verifies the
token** (`verify.ts`) -> `findOrCreateUser` -> mints Cognito tokens via the `CUSTOM_AUTH`
shared-secret challenge (it never owns/sets the user's password). See the security model below.

## Endpoint contract

All routes are `POST` under `AUTH_CONFIG.authApiBase`. `{ ok: true }` is a success with no
session; "session" is `{ idToken, accessToken, refreshToken?, expiresIn, user }`.

| Route | Request body | Success | Notes |
|-------|--------------|---------|-------|
| `/auth/signup` | `{ email, password }` | `{ ok: true }` | Cognito emails a confirmation code. |
| `/auth/confirm` | `{ email, code }` | `{ ok: true }` | Confirms the new account. |
| `/auth/resend` | `{ email }` | `{ ok: true }` | Re-sends the confirmation code. |
| `/auth/login` | `{ email, password }` | session | `InitiateAuth USER_PASSWORD_AUTH`. |
| `/auth/forgot` | `{ email }` | `{ ok: true }` | Emails a reset code. |
| `/auth/forgot-confirm` | `{ email, code, password }` | `{ ok: true }` | Sets the new password. |
| `/auth/refresh` | `{ refreshToken }` | session **without** `refreshToken` | `REFRESH_TOKEN_AUTH`; the client keeps its existing refresh token. |
| `/auth/social` | `{ provider, idToken }` | session | `provider` is `apple`/`google`. |

Errors are `{ code }` with an HTTP status (`respond.ts` maps Cognito error names → status).
The device throws an `Error` whose `.name` **is** that `code`; `errors.ts` maps it to copy.
Authoritative lists: statuses in `backend/src/lib/respond.ts`, copy in
`frontend/src/auth/errors.ts`. Codes include the Cognito names (`NotAuthorizedException`,
`UserNotConfirmedException`, `UsernameExistsException`, `CodeMismatchException`,
`ExpiredCodeException`, `InvalidPasswordException`, `InvalidParameterException`,
`LimitExceededException`/`TooManyRequestsException`), the broker's own
(`NoAccount`, `InvalidToken`, `ProviderNotConfigured`, `InvalidJSON`, `InternalError`),
and the client's `NetworkError`.

## Session lifecycle (device)

- **Storage** (`storage.ts`): four `expo-secure-store` keys — `id`, `access`, `refresh`,
  and a small `meta` (`{ user, expiresAt }`). One key per token because a single JSON blob
  of all three JWTs can exceed SecureStore's ~2KB-per-item iOS limit. `saveSession` is
  **all-or-clear**: a partial write failure wipes every key so `loadSession` returns `null`
  (a clean signed-out state) rather than an inconsistent session that can never refresh.
- **Hydrate** (`auth-provider.tsx`): on launch, load the session; if
  `expiresAt > now + 60s` use it, else refresh once; on refresh failure, clear + sign out.
- **`expiresAt`** is `now + expiresIn` snapshotted at save time (device clock), **not** the
  token's real `exp` claim.

### Known limitation — refresh is launch-only

Refresh happens *only* during the on-launch hydrate. There is no runtime / 401-triggered
refresh, and `expiresAt` is device-clock based. This is harmless **today** because nothing
makes authenticated calls (AI readings are offline stubs in `src/ai/dream-ai.ts`).
**Before the first authenticated request lands**, route every token read through a shared
`getValidSession()` that refreshes on the skew window *and* on a `401`, and signs out on an
unrecoverable refresh — don't special-case refresh at the call site.

## Security model

- **No user enumeration.** The pool sets `prevent_user_existence_errors = ENABLED`, and the
  broker additionally collapses `UserNotFoundException` → `NotAuthorizedException` (same
  status *and* code as a wrong password) in `respond.ts`, so login can't distinguish
  "no such email" from "wrong password". *Residual:* `/auth/forgot` and `/auth/resend` can
  still leak the existence of *unconfirmed* accounts via `InvalidParameterException` — a
  low, largely Cognito-inherent signal; revisit if it matters.
- **Social: only a provider-VERIFIED email links.** `verify.ts` checks `aud`/`iss`/`exp`
  against the provider JWKS; `cognito.ts` requires `email_verified` before creating or
  matching an account. This closes the `email_verified`-bypass account-takeover class.
- **Social token minting never touches passwords.** The broker answers a `CUSTOM_AUTH`
  shared-secret challenge (compared with `crypto.timingSafeEqual` in `custom-auth.ts`); a
  random password is set on a social user **only at creation**, never on an existing user.
- **JWT decode vs verify.** The broker `decodeJwt` (no signature check) **only** on tokens
  that came straight out of a Cognito `AuthenticationResult` in the same response (trusted).
  Any attacker-supplied token (`/auth/social`) goes through full `jwtVerify`. Never trust a
  decoded-but-unverified token for a security decision.
- **No client secret** — the app client is a public mobile client. The device holds no
  long-lived AWS credential; the broker's Lambdas use least-privilege IAM scoped to the pool.

## Known follow-ups

- **Runtime + 401 refresh** on the device (see the limitation above) — do before any authed call.
- **Nonce binding (replay protection)** for social: the native app should generate a nonce,
  embed it in the Apple/Google request, and the broker should verify the token's `nonce`.
- **Apple email-only-first-time:** Apple returns the email only on the *first* authorization;
  the client must capture and forward it then, or a reinstall yields a token with no email.
- **SES for email** before real traffic — Cognito's `COGNITO_DEFAULT` is capped at 50/day.
- **Native social wiring:** real client IDs (`GOOGLE_CLIENT_IDS_JSON`, `APPLE_AUDIENCES_JSON`
  repo vars), native config (`ios.bundleIdentifier`, the apple plugin, the google
  `iosUrlScheme`), and an **EAS dev build** (native SDKs don't run in Expo Go).

## Verify

Per area (full commands in the area `AGENTS.md`): backend → `npm run typecheck` + `build`;
frontend → `tsc --noEmit` + `expo export --platform web`; infra → `terraform fmt` + `validate`.

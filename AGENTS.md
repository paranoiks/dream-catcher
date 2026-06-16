# Dream Catcher — agent guide (root)

This repo is developed mainly by Claude. Docs are written for **agent consumption**: dense,
actionable, with invariants and exact verify commands — not human onboarding prose. Each area
has its own `AGENTS.md` that the harness auto-loads when you work in that subtree; read it first.

## Map
```
frontend/   Expo SDK 56 app (expo-router). The dream journal + "celestial almanac" design.   -> frontend/AGENTS.md
backend/    TypeScript Lambdas for Cognito auth (social token broker + custom-auth trigger).  -> backend/AGENTS.md
infra/      Terraform: Cognito, Lambdas, HTTP API, state backend, GitHub OIDC.                -> infra/AGENTS.md
docs/       Deep per-system reference (the why + full contracts), linked from each AGENTS.md.  -> docs/README.md
```

## Architecture in one line
One **Cognito** user pool is the identity directory. The app talks **only to our `/auth/*` broker**
(Lambdas that make the Cognito calls) — for both email/password and native Apple/Google — so there's
**no Cognito SDK or native crypto on the device** and **no hosted login UI anywhere** (don't
reintroduce Hosted UI — it's the design-continuity requirement, and Cognito SRP doesn't work on Expo).

## Conventions
- TypeScript everywhere; kebab-case filenames; reuse existing modules before adding new ones.
- **Verify before declaring done** — per area: `frontend/` → `tsc --noEmit` + `expo export --platform web`; `backend/` → `npm run typecheck` + `npm run build`; `infra/` → `terraform fmt` + `validate`.
- Generated files are marked as such and must not be hand-edited (e.g. `frontend/src/theme/tokens.ts`).
- Deploy is GitHub Actions → AWS over **OIDC** (no static keys). Prod-only for now. Commit `.terraform.lock.hcl`; never commit `*.tfvars` / `backend.hcl` / secrets.

## Workflow (definition of done)
**Claude builds and verifies; Claude never commits or pushes** — enforced in `.claude/settings.json` by a deny rule plus a `PreToolUse` guard that blocks any `git … commit`/`push` (a bare deny misses forms like `git -C <path> commit`). This is a UI-heavy app, so changes are tested on real devices before they land. Per chunk:
1. **Build + self-verify** — run the per-area commands above (frontend → `tsc` + `expo export`; backend → `typecheck` + `build`; infra → `fmt` + `validate`), updating docs in the same change.
2. **Human tests** it on **iOS and Android** (look & feel).
3. **Code review** — run `/code-review` (local effort; `high` for security-sensitive code like auth); triage findings and fix the real ones. `/code-review ultra` is cloud/billed and user-triggered only; don't launch it.
4. **Human commits + pushes** — docs ship in the same commit as the code; messages end with the `Co-Authored-By` trailer.

## Git
Default branch `main`. **Claude does not run `git commit` or `git push`** (denied in settings) — the human commits after testing + review.

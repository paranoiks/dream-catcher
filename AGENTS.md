# Dream Catcher — agent guide (root)

This repo is developed mainly by Claude. Docs are written for **agent consumption**: dense,
actionable, with invariants and exact verify commands — not human onboarding prose. Each area
has its own `AGENTS.md` that the harness auto-loads when you work in that subtree; read it first.

## Map
```
frontend/   Expo SDK 56 app (expo-router). The dream journal + "celestial almanac" design.   -> frontend/AGENTS.md
backend/    TypeScript Lambdas for Cognito auth (social token broker + custom-auth trigger).  -> backend/AGENTS.md
infra/      Terraform: Cognito, Lambdas, HTTP API, state backend, GitHub OIDC.                -> infra/AGENTS.md
```

## Architecture in one line
One **Cognito** user pool is the identity directory; email/password uses client-side SRP and
Apple/Google use native SDKs whose tokens a Lambda exchanges for Cognito tokens — **no hosted
login UI anywhere** (that's the design-continuity requirement; don't reintroduce Hosted UI).

## Conventions
- TypeScript everywhere; kebab-case filenames; reuse existing modules before adding new ones.
- **Verify before declaring done** — per area: `frontend/` → `tsc --noEmit` + `expo export --platform web`; `backend/` → `npm run typecheck` + `npm run build`; `infra/` → `terraform fmt` + `validate`.
- Generated files are marked as such and must not be hand-edited (e.g. `frontend/src/theme/tokens.ts`).
- Deploy is GitHub Actions → AWS over **OIDC** (no static keys). Prod-only for now. Commit `.terraform.lock.hcl`; never commit `*.tfvars` / `backend.hcl` / secrets.

## Workflow (definition of done)
For any non-trivial change: **implement → `/code-review` → fix real findings → update docs → verify → commit.**
- **Review before committing.** `/code-review` reviews the branch diff (works on committed-but-unpushed work too). Use a local effort level — `high` for security-sensitive code like auth — then triage: verify findings, drop false positives, fix the rest. `/code-review ultra` is cloud/billed and user-triggered only; don't launch it.
- **Docs ship with the change.** Update the relevant `AGENTS.md` and any invariants in the **same commit** as the code.
- **Verify** with the per-area commands above before committing.
- Trivial docs-only edits may skip the full review.

## Git
Default branch `main`. Keep commit messages factual; end with the `Co-Authored-By` trailer.

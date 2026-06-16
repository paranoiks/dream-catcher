# infra/ — Terraform (agent guide)

Two stacks. `bootstrap/` is applied **once, locally, by a human with admin creds** (it creates the state backend + the OIDC role CI uses). The app stack (`infra/`) is applied by CI over OIDC, state in S3.

## Verify (no AWS creds needed)
```sh
terraform fmt -recursive infra
terraform -chdir=infra init -backend=false && terraform -chdir=infra validate
# (bootstrap likewise: terraform -chdir=infra/bootstrap init -backend=false && validate)
```
Run human bootstrap/apply steps from `README.md`. Do not commit `*.tfvars`, `backend.hcl`, or `.terraform/`; **do** commit `.terraform.lock.hcl`.

## Local AWS auth (multi-account safety)
Local runs target AWS via a **named profile, never `default`** (the repo has multiple AWS accounts in play; `default` is how you hit the wrong one). This repo pins `AWS_PROFILE=dreamcatcher` via `.envrc` (direnv); otherwise prefix commands with `AWS_PROFILE=dreamcatcher`. **Always confirm before an apply:** `aws sts get-caller-identity` must show the dreamcatcher account ID. CI does not use profiles — it assumes the deploy role via OIDC.

## Must-know
- **Build the backend before `terraform plan/apply`.** `lambda.tf` zips `backend/dist/*` via `archive_file`; without `npm --prefix backend run build` those dirs don't exist and plan fails. CI does this in the build step.
- **State backend is partial config** (`versions.tf` has `backend "s3" {}`). Supply bucket/table/region via `-backend-config=backend.hcl` (copy from `backend.hcl.example`) or CI `-backend-config` flags.
- **Resource naming** is `${var.project}-*` (default `dream-catcher`). The CI IAM policy in `bootstrap/main.tf` scopes IAM to that prefix — keep new resource names under it.
- **Cognito auth flows:** the app client allows `USER_PASSWORD_AUTH` (email/pass — SRP isn't usable on RN/Expo, which lack the native secure-random it needs), `CUSTOM_AUTH` (social broker), `REFRESH_TOKEN_AUTH`. No client secret (public mobile client). The `lambda_config` triggers all point at the one `custom-auth` Lambda.
- **HTTP API (`apigw.tf`) → two broker Lambdas:** `POST /auth/social` → `social`; the seven `/auth/{signup,confirm,resend,login,forgot,forgot-confirm,refresh}` routes → `email-auth` (one Lambda, routed by `event.routeKey`). `custom-auth` is a Cognito trigger, not an API route.
- Cognito email is `COGNITO_DEFAULT` (50/day cap) — switch to SES before real traffic.

## CI variable contract (GitHub repo Variables)
`AWS_DEPLOY_ROLE_ARN`, `TF_STATE_BUCKET`, `TF_STATE_LOCK_TABLE`, `AWS_REGION`, and (once social apps exist) `GOOGLE_CLIENT_IDS_JSON`, `APPLE_AUDIENCES_JSON`. Workflows pass the JSON ones through as `TF_VAR_google_client_ids` / `TF_VAR_apple_audiences`.

Outputs (`terraform -chdir=infra output`) feed the mobile app: `user_pool_id`, `user_pool_client_id`, `auth_api_url`. See `../backend/AGENTS.md` for the auth model.

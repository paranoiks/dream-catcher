# Dream Catcher — backend infrastructure

AWS auth backend: a **Cognito** user pool (the single identity directory) fronted
by an **HTTP API** + Lambda for native social login. Email/password is handled
client-side via Cognito SRP; Apple/Google are verified server-side and exchanged
for Cognito tokens — so there is **no hosted login UI** anywhere.

```
infra/bootstrap/   one-time, local: S3 state bucket + DynamoDB lock + GitHub OIDC role
infra/             app stack: Cognito, Lambdas, HTTP API (state in S3, deployed by CI)
backend/           Lambda source (TypeScript, bundled with esbuild)
```

## Architecture
- **Email / password** → app ↔ Cognito directly (SRP). Password never touches our servers.
- **Apple / Google** → app gets a native `idToken` → `POST /auth/social` Lambda verifies it
  (provider JWKS, `aud`/`iss`/`exp`), finds-or-creates the Cognito user, and returns Cognito
  tokens by answering a `CUSTOM_AUTH` challenge with a shared secret (the `custom-auth` trigger
  gates on it). Social users get a throwaway random password to reach `CONFIRMED`; it is never
  used and email/password users' own credentials are never touched.

## One-time setup

### 1. Prerequisites (local)
- Terraform ≥ 1.5, AWS CLI, Node 20
- AWS credentials with admin access for the **bootstrap** apply (e.g. an IAM Identity Center
  profile, or a temporary admin access key). CI uses OIDC after this — no long-lived keys.

### 2. Bootstrap (run once, locally)
```sh
cd infra/bootstrap
terraform init
terraform apply           # review, then yes
terraform output          # note the four values below
```

### 3. Configure GitHub (repo → Settings → Secrets and variables → Actions → Variables)
Create these **repository variables** from the bootstrap outputs:

| Variable | From |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | `ci_deploy_role_arn` |
| `TF_STATE_BUCKET` | `state_bucket` |
| `TF_STATE_LOCK_TABLE` | `lock_table` |
| `AWS_REGION` | `region` (e.g. `us-east-1`) |

Then create a GitHub **Environment** named `production` (Settings → Environments) — add a
required reviewer there if you want a manual gate before prod applies.

### 4. Deploy the app stack
Push to `main` (or run the **Deploy (prod)** workflow). CI builds the Lambdas, then
`terraform apply`. To run it locally instead:
```sh
cp infra/backend.hcl.example infra/backend.hcl   # fill from bootstrap outputs
npm --prefix backend ci && npm --prefix backend run build
terraform -chdir=infra init -backend-config=backend.hcl
terraform -chdir=infra apply
```

### 5. Wire the social providers (when the Apple/Google apps exist)
Add these repository variables (public client IDs, not secrets) and re-run Deploy:
- `GOOGLE_CLIENT_IDS_JSON` — e.g. `["web.apps.googleusercontent.com","ios...","android..."]`
- `APPLE_AUDIENCES_JSON` — e.g. `["com.paranoiks.dreamcatcher"]`

`terraform -chdir=infra output` then gives `user_pool_id`, `user_pool_client_id`, and
`auth_api_url` for the mobile app config.

// Public Cognito + auth-API config — values from `terraform -chdir=infra output`.
// These are non-secret client identifiers (the kind that ship inside any mobile
// app); safe to commit. Regenerate if the app stack is recreated.
export const AUTH_CONFIG = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_IoClqL4cx',
  userPoolClientId: '44f26j5snaejb9sktcvng4si8h',
  authApiBase: 'https://wflmsmk0jl.execute-api.us-east-1.amazonaws.com',
} as const;

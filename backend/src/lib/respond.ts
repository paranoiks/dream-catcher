// Shared HTTP helpers for the auth endpoints: a JSON responder, a session builder
// from a Cognito AuthenticationResult, and Cognito-error → status/code mapping.
import type { AuthenticationResultType } from '@aws-sdk/client-cognito-identity-provider';
import { decodeJwt } from 'jose';

export function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

export type AuthUser = { sub: string; email?: string };

// Read sub/email from an id token we just received from Cognito (no verification
// needed — it came straight from Cognito over TLS; we only read claims).
export function userFromIdToken(idToken: string): AuthUser {
  const claims = decodeJwt(idToken);
  return { sub: String(claims.sub ?? ''), email: typeof claims.email === 'string' ? claims.email : undefined };
}

export function sessionFrom(r: AuthenticationResultType) {
  if (!r.IdToken || !r.AccessToken) throw new Error('Cognito returned no tokens');
  return {
    idToken: r.IdToken,
    accessToken: r.AccessToken,
    refreshToken: r.RefreshToken, // absent on REFRESH_TOKEN_AUTH — the client keeps its existing one
    expiresIn: r.ExpiresIn,
    user: userFromIdToken(r.IdToken),
  };
}

// Cognito SDK error name → HTTP status. The `code` travels to the app, which maps
// it to in-voice copy (see frontend src/auth/errors.ts).
const STATUS: Record<string, number> = {
  NotAuthorizedException: 401,
  UserNotConfirmedException: 403,
  UserNotFoundException: 404,
  UsernameExistsException: 409,
  CodeMismatchException: 400,
  ExpiredCodeException: 400,
  InvalidPasswordException: 400,
  InvalidParameterException: 400,
  LimitExceededException: 429,
  TooManyRequestsException: 429,
};

export function errorResponse(err: unknown) {
  const name = err instanceof Error ? err.name : 'Error';
  const status = STATUS[name];
  if (status) return json(status, { code: name });
  console.error('auth error:', err); // unexpected — don't leak details
  return json(500, { code: 'InternalError' });
}

// Decode Cognito id tokens for display/expiry. No signature check — these are
// tokens Cognito just issued to us; we only read claims. Uses the SDK's decoder
// so there's no base64/atob polyfill dependency.
import { CognitoIdToken } from 'amazon-cognito-identity-js';

import type { AuthUser } from './types';

export function userFromIdToken(idToken: string): AuthUser | null {
  try {
    const payload = new CognitoIdToken({ IdToken: idToken }).decodePayload();
    if (!payload?.sub) return null;
    const username = payload['cognito:username'] ?? payload.sub;
    return {
      sub: String(payload.sub),
      username: String(username),
      email: payload.email ? String(payload.email) : undefined,
    };
  } catch {
    return null;
  }
}

export function isIdTokenExpired(idToken: string, skewSeconds = 30): boolean {
  try {
    const exp = new CognitoIdToken({ IdToken: idToken }).getExpiration(); // seconds since epoch
    return Date.now() / 1000 >= exp - skewSeconds;
  } catch {
    return true;
  }
}

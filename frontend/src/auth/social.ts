// Exchange a native provider idToken (Apple/Google) for Cognito tokens via the
// /auth/social broker. The native sign-in that produces the idToken lives with
// the auth screens (it needs platform-guarded SDKs + real client IDs).
import { AUTH_CONFIG } from './config';
import type { AuthTokens, Provider } from './types';

export async function exchangeSocialToken(provider: Provider, idToken: string): Promise<AuthTokens> {
  const res = await fetch(`${AUTH_CONFIG.authApiBase}/auth/social`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider, idToken }),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = ((await res.json()) as { error?: string }).error ?? '';
    } catch {
      // non-JSON body
    }
    throw new Error(detail || `Social sign-in failed (${res.status})`);
  }
  const data = (await res.json()) as { idToken: string; accessToken: string; refreshToken: string };
  return { idToken: data.idToken, accessToken: data.accessToken, refreshToken: data.refreshToken };
}

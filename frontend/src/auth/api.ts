// api.ts — the auth client. Plain fetch() to our /auth/* broker; the backend does
// all the Cognito work, so there's no Cognito SDK or native crypto on the device.
// Errors are thrown as `Error` whose `name` is the backend's `code` (mapped to copy
// in errors.ts).
import { AUTH_CONFIG } from './config';
import type { AuthUser, Provider, Session } from './types';

type SessionResponse = {
  idToken: string;
  accessToken: string;
  refreshToken?: string; // absent on refresh — the client keeps its existing one
  expiresIn?: number;
  user: AuthUser;
};

function authError(code: string): Error {
  const e = new Error(code);
  e.name = code;
  return e;
}

async function post(path: string, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_CONFIG.authApiBase}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw authError('NetworkError');
  }
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) throw authError((data as { code?: string }).code ?? 'InternalError');
  return data;
}

function toSession(data: SessionResponse, fallbackRefresh?: string): Session {
  // `||` not `??`: an empty-string token or expiresIn:0 is as good as absent and must
  // fall back (refresh omits refreshToken → keep the caller's existing one).
  const refreshToken = data.refreshToken || fallbackRefresh;
  if (!data.idToken || !data.accessToken || !refreshToken) throw authError('InternalError');
  return {
    tokens: { idToken: data.idToken, accessToken: data.accessToken, refreshToken },
    user: data.user,
    expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
  };
}

export const api = {
  async signUp(email: string, password: string): Promise<void> {
    await post('/auth/signup', { email, password });
  },
  async confirmSignUp(email: string, code: string): Promise<void> {
    await post('/auth/confirm', { email, code });
  },
  async resendCode(email: string): Promise<void> {
    await post('/auth/resend', { email });
  },
  async forgotPassword(email: string): Promise<void> {
    await post('/auth/forgot', { email });
  },
  async confirmForgotPassword(email: string, code: string, password: string): Promise<void> {
    await post('/auth/forgot-confirm', { email, code, password });
  },
  async signIn(email: string, password: string): Promise<Session> {
    return toSession((await post('/auth/login', { email, password })) as SessionResponse);
  },
  async refresh(refreshToken: string): Promise<Session> {
    return toSession((await post('/auth/refresh', { refreshToken })) as SessionResponse, refreshToken);
  },
  async social(provider: Provider, idToken: string): Promise<Session> {
    return toSession((await post('/auth/social', { provider, idToken })) as SessionResponse);
  },
};

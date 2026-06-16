// AuthProvider — the app's auth state, backed by the /auth/* broker. Hydrates from
// SecureStore on launch (refreshing an expired session when possible), and exposes
// email/password + social sign-in. Social takes a native provider idToken.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { api } from './api';
import { clearSession, loadSession, saveSession } from './storage';
import type { AuthUser, Provider, Session } from './types';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: Status;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signInWithSocial: (provider: Provider, providerIdToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const apply = useCallback(async (session: Session) => {
    await saveSession(session);
    setUser(session.user);
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await loadSession();
      if (!session) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      if (session.expiresAt > Date.now() + 60_000) {
        if (!cancelled) {
          setUser(session.user);
          setStatus('signedIn');
        }
        return;
      }
      // expired — try a refresh before giving up
      try {
        const refreshed = await api.refresh(session.tokens.refreshToken);
        if (cancelled) return;
        await saveSession(refreshed);
        setUser(refreshed.user);
        setStatus('signedIn');
      } catch {
        await clearSession();
        if (!cancelled) setStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => apply(await api.signIn(email, password)), [apply]);
  const signUp = useCallback((email: string, password: string) => api.signUp(email, password), []);
  const confirmSignUp = useCallback((email: string, code: string) => api.confirmSignUp(email, code), []);
  const resendCode = useCallback((email: string) => api.resendCode(email), []);
  const forgotPassword = useCallback((email: string) => api.forgotPassword(email), []);
  const confirmForgotPassword = useCallback(
    (email: string, code: string, newPassword: string) => api.confirmForgotPassword(email, code, newPassword),
    [],
  );
  const signInWithSocial = useCallback(
    async (provider: Provider, providerIdToken: string) => apply(await api.social(provider, providerIdToken)),
    [apply],
  );
  const signOut = useCallback(async () => {
    await clearSession();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value: AuthContextValue = {
    status,
    user,
    signIn,
    signUp,
    confirmSignUp,
    resendCode,
    forgotPassword,
    confirmForgotPassword,
    signInWithSocial,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

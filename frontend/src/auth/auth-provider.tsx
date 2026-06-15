// AuthProvider — the app's auth state. Hydrates from SecureStore on launch
// (refreshing an expired session when possible), and exposes email/password +
// social sign-in. Social takes a native provider idToken and brokers it.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import * as cognito from './cognito';
import { isIdTokenExpired, userFromIdToken } from './jwt';
import { exchangeSocialToken } from './social';
import { clearTokens, loadTokens, saveTokens } from './storage';
import type { AuthTokens, AuthUser, Provider } from './types';

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

  const applyTokens = useCallback(async (tokens: AuthTokens) => {
    await saveTokens(tokens);
    setUser(userFromIdToken(tokens.idToken));
    setStatus('signedIn');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = await loadTokens();
      const u = tokens ? userFromIdToken(tokens.idToken) : null;
      if (!tokens || !u) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      if (!isIdTokenExpired(tokens.idToken)) {
        if (!cancelled) {
          setUser(u);
          setStatus('signedIn');
        }
        return;
      }
      // expired id token — try a refresh before giving up
      try {
        const refreshed = await cognito.refresh(u.username, tokens.refreshToken);
        if (cancelled) return;
        await saveTokens(refreshed);
        setUser(userFromIdToken(refreshed.idToken));
        setStatus('signedIn');
      } catch {
        await clearTokens();
        if (!cancelled) setStatus('signedOut');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => applyTokens(await cognito.signIn(email, password)),
    [applyTokens],
  );
  const signUp = useCallback((email: string, password: string) => cognito.signUp(email, password), []);
  const confirmSignUp = useCallback((email: string, code: string) => cognito.confirmSignUp(email, code), []);
  const resendCode = useCallback((email: string) => cognito.resendCode(email), []);
  const forgotPassword = useCallback((email: string) => cognito.forgotPassword(email), []);
  const confirmForgotPassword = useCallback(
    (email: string, code: string, newPassword: string) => cognito.confirmForgotPassword(email, code, newPassword),
    [],
  );
  const signInWithSocial = useCallback(
    async (provider: Provider, providerIdToken: string) => applyTokens(await exchangeSocialToken(provider, providerIdToken)),
    [applyTokens],
  );
  const signOut = useCallback(async () => {
    if (user) cognito.signOut(user.username);
    await clearTokens();
    setUser(null);
    setStatus('signedOut');
  }, [user]);

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

// Persist the session in the device keychain via expo-secure-store. Tokens are
// stored under separate keys (a single JSON blob of all three JWTs can exceed
// SecureStore's ~2KB-per-item limit on iOS); user + expiry ride in a small meta key.
import * as SecureStore from 'expo-secure-store';

import type { Session } from './types';

const KEYS = {
  id: 'dreamcatcher_auth_id',
  access: 'dreamcatcher_auth_access',
  refresh: 'dreamcatcher_auth_refresh',
  meta: 'dreamcatcher_auth_meta',
} as const;

export async function saveSession(s: Session): Promise<void> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.id, s.tokens.idToken),
      SecureStore.setItemAsync(KEYS.access, s.tokens.accessToken),
      SecureStore.setItemAsync(KEYS.refresh, s.tokens.refreshToken),
      SecureStore.setItemAsync(KEYS.meta, JSON.stringify({ user: s.user, expiresAt: s.expiresAt })),
    ]);
  } catch (e) {
    // A partial write would leave an inconsistent session (e.g. a freshly rotated
    // id/access token beside a stale refresh token → can never refresh). Wipe all
    // keys so loadSession returns null and we fall back to a clean signed-out state.
    await clearSession().catch(() => {});
    throw e;
  }
}

export async function loadSession(): Promise<Session | null> {
  const [idToken, accessToken, refreshToken, meta] = await Promise.all([
    SecureStore.getItemAsync(KEYS.id),
    SecureStore.getItemAsync(KEYS.access),
    SecureStore.getItemAsync(KEYS.refresh),
    SecureStore.getItemAsync(KEYS.meta),
  ]);
  if (!idToken || !accessToken || !refreshToken || !meta) return null;
  try {
    const { user, expiresAt } = JSON.parse(meta) as Pick<Session, 'user' | 'expiresAt'>;
    return { tokens: { idToken, accessToken, refreshToken }, user, expiresAt };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
}

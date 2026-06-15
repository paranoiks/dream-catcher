// Persist Cognito tokens in the device keychain/keystore via expo-secure-store.
// Stored under separate keys because a single JSON blob of all three JWTs can
// exceed SecureStore's ~2KB-per-item limit on iOS.
import * as SecureStore from 'expo-secure-store';

import type { AuthTokens } from './types';

const KEYS = {
  id: 'dreamcatcher_auth_id',
  access: 'dreamcatcher_auth_access',
  refresh: 'dreamcatcher_auth_refresh',
} as const;

export async function saveTokens(t: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.id, t.idToken),
    SecureStore.setItemAsync(KEYS.access, t.accessToken),
    SecureStore.setItemAsync(KEYS.refresh, t.refreshToken),
  ]);
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const [idToken, accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(KEYS.id),
    SecureStore.getItemAsync(KEYS.access),
    SecureStore.getItemAsync(KEYS.refresh),
  ]);
  if (!idToken || !accessToken || !refreshToken) return null;
  return { idToken, accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.id),
    SecureStore.deleteItemAsync(KEYS.access),
    SecureStore.deleteItemAsync(KEYS.refresh),
  ]);
}

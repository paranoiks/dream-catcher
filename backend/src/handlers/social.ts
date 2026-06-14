// social.ts — POST /auth/social { provider, idToken } → Cognito tokens.
// Verifies the provider token, finds-or-creates the pool user, returns a session.
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { findOrCreateUser, issueTokens, NoAccountForToken } from '../lib/cognito';
import { ProviderNotConfigured, verifyProvider, type Provider } from '../lib/verify';

const config = {
  google: splitEnv('GOOGLE_CLIENT_IDS'),
  apple: splitEnv('APPLE_AUDIENCES'),
};

function splitEnv(name: string): string[] {
  return (process.env[name] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let body: { provider?: string; idToken?: string };
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return json(400, { error: 'invalid JSON body' });
  }

  const provider = body.provider as Provider;
  const idToken = body.idToken;
  if ((provider !== 'google' && provider !== 'apple') || !idToken) {
    return json(400, { error: 'provider must be "google" or "apple" and idToken is required' });
  }

  try {
    const identity = await verifyProvider(provider, idToken, config);
    const username = await findOrCreateUser(identity);
    const tokens = await issueTokens(username);
    return json(200, tokens);
  } catch (err) {
    if (err instanceof ProviderNotConfigured) return json(503, { error: 'provider not configured' });
    if (err instanceof NoAccountForToken) return json(401, { error: 'no account; sign in on this device first' });
    // jose verification failures and the rest — don't leak details.
    console.error('social auth failed:', err);
    const name = err instanceof Error ? err.name : 'Error';
    if (name.startsWith('JWT') || name.startsWith('JWS') || name === 'JOSEError') {
      return json(401, { error: 'invalid token' });
    }
    return json(500, { error: 'internal error' });
  }
};

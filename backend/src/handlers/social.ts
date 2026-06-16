// social.ts — POST /auth/social { provider, idToken } → Cognito session.
// Verifies the provider token, finds-or-creates the pool user, returns a session
// in the same shape as the email/password endpoints (tokens + user).
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { findOrCreateUser, issueTokens, NoAccountForToken } from '../lib/cognito';
import { errorResponse, json, userFromIdToken } from '../lib/respond';
import { isTokenError, ProviderNotConfigured, verifyProvider, type Provider } from '../lib/verify';

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

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let body: { provider?: string; idToken?: string };
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return json(400, { code: 'InvalidJSON' });
  }

  const provider = body.provider as Provider;
  const idToken = body.idToken;
  if ((provider !== 'google' && provider !== 'apple') || !idToken) {
    return json(400, { code: 'InvalidParameterException' });
  }

  try {
    const identity = await verifyProvider(provider, idToken, config);
    const username = await findOrCreateUser(identity);
    const tokens = await issueTokens(username);
    return json(200, { ...tokens, user: userFromIdToken(tokens.idToken) });
  } catch (err) {
    if (err instanceof ProviderNotConfigured) return json(503, { code: 'ProviderNotConfigured' });
    if (err instanceof NoAccountForToken) return json(401, { code: 'NoAccount' });
    if (isTokenError(err)) return json(401, { code: 'InvalidToken' });
    return errorResponse(err);
  }
};

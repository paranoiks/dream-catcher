// verify.ts — validate a provider idToken against the provider's published JWKS.
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const googleJWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleJWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export type Provider = 'google' | 'apple';

export type VerifiedIdentity = {
  provider: Provider;
  sub: string;
  email?: string;
  emailVerified: boolean;
};

// Apple sends email_verified as the string "true"; Google as a boolean.
function asBool(v: unknown): boolean {
  return v === true || v === 'true';
}

function toIdentity(provider: Provider, payload: JWTPayload): VerifiedIdentity {
  if (!payload.sub) throw new Error('token missing sub');
  return {
    provider,
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email.toLowerCase() : undefined,
    emailVerified: asBool((payload as Record<string, unknown>).email_verified),
  };
}

export async function verifyGoogle(idToken: string, audiences: string[]): Promise<VerifiedIdentity> {
  if (audiences.length === 0) throw new ProviderNotConfigured('google');
  const { payload } = await jwtVerify(idToken, googleJWKS, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: audiences,
  });
  return toIdentity('google', payload);
}

export async function verifyApple(idToken: string, audiences: string[]): Promise<VerifiedIdentity> {
  if (audiences.length === 0) throw new ProviderNotConfigured('apple');
  const { payload } = await jwtVerify(idToken, appleJWKS, {
    issuer: 'https://appleid.apple.com',
    audience: audiences,
  });
  return toIdentity('apple', payload);
}

export class ProviderNotConfigured extends Error {
  constructor(provider: string) {
    super(`provider ${provider} is not configured`);
    this.name = 'ProviderNotConfigured';
  }
}

export async function verifyProvider(
  provider: Provider,
  idToken: string,
  config: { google: string[]; apple: string[] },
): Promise<VerifiedIdentity> {
  return provider === 'google'
    ? verifyGoogle(idToken, config.google)
    : verifyApple(idToken, config.apple);
}

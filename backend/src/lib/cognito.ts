// cognito.ts — find-or-create a pool user for a verified social identity, then
// mint Cognito tokens via the CUSTOM_AUTH shared-secret challenge (no password,
// and email/password users' own credentials are never touched).
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
  UsernameExistsException,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import { randomBytes } from 'node:crypto';

import type { VerifiedIdentity } from './verify';

const client = new CognitoIdentityProviderClient({});

const USER_POOL_ID = requireEnv('USER_POOL_ID');
const CLIENT_ID = requireEnv('CLIENT_ID');
const CHALLENGE_SECRET = requireEnv('CHALLENGE_SECRET');

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env ${name}`);
  return v;
}

// Strong random password just to move an admin-created social user to CONFIRMED.
// It is never used for sign-in (social auth goes through CUSTOM_AUTH).
function randomPassword(): string {
  return 'Aa1' + randomBytes(30).toString('base64url');
}

export class NoAccountForToken extends Error {
  constructor() {
    super('no existing account for this token and no email to create one');
    this.name = 'NoAccountForToken';
  }
}

export type IssuedTokens = {
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
};

async function getUser(username: string) {
  try {
    return await client.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: username }));
  } catch (err) {
    if (err instanceof UserNotFoundException) return undefined;
    throw err;
  }
}

// An admin-created social user lands in FORCE_CHANGE_PASSWORD, which blocks auth.
// A permanent (never-used) password confirms them. Also recovers a user left
// half-created by an earlier partial failure or a lost create race.
async function ensureConfirmed(username: string, status?: string) {
  if (status === 'FORCE_CHANGE_PASSWORD' || status === 'RESET_REQUIRED') {
    await client.send(
      new AdminSetUserPasswordCommand({ UserPoolId: USER_POOL_ID, Username: username, Password: randomPassword(), Permanent: true }),
    );
  }
}

export async function findOrCreateUser(identity: VerifiedIdentity): Promise<string> {
  // The sub is from a verified token, but never trust its shape inside a filter expression.
  if (!/^[\w.|-]+$/.test(identity.sub)) throw new Error('unexpected provider sub format');
  const preferred = `${identity.provider}_${identity.sub}`;

  // Only an email the provider actually VERIFIED may match or create an account.
  // Otherwise a token bearing an attacker-chosen unverified email could seize the
  // matching account (the classic email_verified-bypass takeover).
  if (identity.email && identity.emailVerified) {
    const existing = await getUser(identity.email);
    if (existing) {
      const hasPreferred = existing.UserAttributes?.some((a) => a.Name === 'preferred_username' && a.Value);
      if (!hasPreferred) {
        await client.send(
          new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: identity.email,
            UserAttributes: [{ Name: 'preferred_username', Value: preferred }],
          }),
        );
      }
      await ensureConfirmed(identity.email, existing.UserStatus);
      return existing.Username!;
    }
    return createUser(identity.email, preferred);
  }

  // No verified email (e.g. an Apple returning user) — only resolve an account we
  // already bound to this exact provider+sub; never create from an unverified email.
  const found = await client.send(
    new ListUsersCommand({ UserPoolId: USER_POOL_ID, Filter: `preferred_username = "${preferred}"`, Limit: 1 }),
  );
  const username = found.Users?.[0]?.Username;
  if (!username) throw new NoAccountForToken();
  return username;
}

async function createUser(email: string, preferred: string): Promise<string> {
  try {
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' }, // only reached for provider-verified emails
          { Name: 'preferred_username', Value: preferred },
        ],
      }),
    );
  } catch (err) {
    // Concurrent first-login for the same email — the other request won the create.
    if (err instanceof UsernameExistsException) {
      const existing = await getUser(email);
      if (existing) {
        await ensureConfirmed(email, existing.UserStatus);
        return existing.Username!;
      }
    }
    throw err;
  }
  await client.send(
    new AdminSetUserPasswordCommand({ UserPoolId: USER_POOL_ID, Username: email, Password: randomPassword(), Permanent: true }),
  );
  return email;
}

export async function issueTokens(username: string): Promise<IssuedTokens> {
  const init = await client.send(
    new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'CUSTOM_AUTH',
      AuthParameters: { USERNAME: username },
    }),
  );
  if (init.ChallengeName !== 'CUSTOM_CHALLENGE' || !init.Session) {
    throw new Error('unexpected challenge from Cognito');
  }

  const resp = await client.send(
    new AdminRespondToAuthChallengeCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      ChallengeName: 'CUSTOM_CHALLENGE',
      Session: init.Session,
      ChallengeResponses: { USERNAME: username, ANSWER: CHALLENGE_SECRET },
    }),
  );
  const r = resp.AuthenticationResult;
  if (!r?.IdToken) throw new Error('Cognito issued no tokens');
  return {
    idToken: r.IdToken,
    accessToken: r.AccessToken,
    refreshToken: r.RefreshToken,
    expiresIn: r.ExpiresIn,
    tokenType: r.TokenType,
  };
}

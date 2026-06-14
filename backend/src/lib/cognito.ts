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

export async function findOrCreateUser(identity: VerifiedIdentity): Promise<string> {
  const preferred = `${identity.provider}_${identity.sub}`;

  if (identity.email) {
    try {
      const existing = await client.send(
        new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: identity.email }),
      );
      const hasPreferred = existing.UserAttributes?.some(
        (a) => a.Name === 'preferred_username' && a.Value,
      );
      if (!hasPreferred) {
        await client.send(
          new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: identity.email,
            UserAttributes: [{ Name: 'preferred_username', Value: preferred }],
          }),
        );
      }
      return existing.Username!;
    } catch (err) {
      if (!(err instanceof UserNotFoundException)) throw err;
    }

    // Brand-new social user.
    await client.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: identity.email,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
          { Name: 'email', Value: identity.email },
          { Name: 'email_verified', Value: identity.emailVerified ? 'true' : 'false' },
          { Name: 'preferred_username', Value: preferred },
        ],
      }),
    );
    await client.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: identity.email,
        Password: randomPassword(),
        Permanent: true,
      }),
    );
    return identity.email;
  }

  // No email (e.g. an Apple returning user) — match by the stored preferred_username.
  const found = await client.send(
    new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `preferred_username = "${preferred}"`,
      Limit: 1,
    }),
  );
  const user = found.Users?.[0];
  if (!user?.Username) throw new NoAccountForToken();
  return user.Username;
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

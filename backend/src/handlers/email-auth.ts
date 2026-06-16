// email-auth.ts — the email/password broker. The app POSTs plain JSON to these
// /auth/* routes; this Lambda makes the Cognito calls (where crypto just works),
// so the client needs no Cognito SDK or native crypto. One Lambda, routed by
// event.routeKey.
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

import { errorResponse, json, sessionFrom } from '../lib/respond';

const client = new CognitoIdentityProviderClient({});
const CLIENT_ID = requireEnv('CLIENT_ID');

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env ${name}`);
  return v;
}

const norm = (email: unknown) => String(email ?? '').trim().toLowerCase();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return json(400, { code: 'InvalidJSON' });
  }

  const email = norm(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  const code = String(body.code ?? '').trim();

  try {
    switch (event.routeKey) {
      case 'POST /auth/signup': {
        if (!email || !password) return json(400, { code: 'InvalidParameterException' });
        await client.send(
          new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [{ Name: 'email', Value: email }],
          }),
        );
        return json(200, { ok: true });
      }

      case 'POST /auth/confirm': {
        if (!email || !code) return json(400, { code: 'InvalidParameterException' });
        await client.send(new ConfirmSignUpCommand({ ClientId: CLIENT_ID, Username: email, ConfirmationCode: code }));
        return json(200, { ok: true });
      }

      case 'POST /auth/resend': {
        if (!email) return json(400, { code: 'InvalidParameterException' });
        await client.send(new ResendConfirmationCodeCommand({ ClientId: CLIENT_ID, Username: email }));
        return json(200, { ok: true });
      }

      case 'POST /auth/login': {
        if (!email || !password) return json(400, { code: 'InvalidParameterException' });
        const out = await client.send(
          new InitiateAuthCommand({
            ClientId: CLIENT_ID,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: { USERNAME: email, PASSWORD: password },
          }),
        );
        if (!out.AuthenticationResult) return json(401, { code: 'NotAuthorizedException' });
        return json(200, sessionFrom(out.AuthenticationResult));
      }

      case 'POST /auth/forgot': {
        if (!email) return json(400, { code: 'InvalidParameterException' });
        await client.send(new ForgotPasswordCommand({ ClientId: CLIENT_ID, Username: email }));
        return json(200, { ok: true });
      }

      case 'POST /auth/forgot-confirm': {
        if (!email || !code || !password) return json(400, { code: 'InvalidParameterException' });
        await client.send(
          new ConfirmForgotPasswordCommand({ ClientId: CLIENT_ID, Username: email, ConfirmationCode: code, Password: password }),
        );
        return json(200, { ok: true });
      }

      case 'POST /auth/refresh': {
        const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : '';
        if (!refreshToken) return json(400, { code: 'InvalidParameterException' });
        const out = await client.send(
          new InitiateAuthCommand({
            ClientId: CLIENT_ID,
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: { REFRESH_TOKEN: refreshToken },
          }),
        );
        if (!out.AuthenticationResult) return json(401, { code: 'NotAuthorizedException' });
        return json(200, sessionFrom(out.AuthenticationResult));
      }

      default:
        return json(404, { code: 'NotFound' });
    }
  } catch (err) {
    return errorResponse(err);
  }
};

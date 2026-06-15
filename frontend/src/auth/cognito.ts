// Email/password auth against Cognito via SRP (password never leaves the device).
// The get-random-values import MUST come first — SRP needs crypto.getRandomValues,
// which React Native/Hermes doesn't provide natively.
import 'react-native-get-random-values';

import {
  AuthenticationDetails,
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';

import { AUTH_CONFIG } from './config';
import type { AuthTokens } from './types';

const pool = new CognitoUserPool({
  UserPoolId: AUTH_CONFIG.userPoolId,
  ClientId: AUTH_CONFIG.userPoolClientId,
});

const normalize = (email: string) => email.trim().toLowerCase();
const userFor = (email: string) => new CognitoUser({ Username: normalize(email), Pool: pool });

function tokensFromSession(s: CognitoUserSession): AuthTokens {
  return {
    idToken: s.getIdToken().getJwtToken(),
    accessToken: s.getAccessToken().getJwtToken(),
    refreshToken: s.getRefreshToken().getToken(),
  };
}

export function signUp(email: string, password: string): Promise<void> {
  const attrs = [new CognitoUserAttribute({ Name: 'email', Value: normalize(email) })];
  return new Promise((resolve, reject) => {
    pool.signUp(normalize(email), password, attrs, [], (err) => (err ? reject(err) : resolve()));
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    userFor(email).confirmRegistration(code.trim(), true, (err) => (err ? reject(err) : resolve()));
  });
}

export function resendCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    userFor(email).resendConfirmationCode((err) => (err ? reject(err) : resolve()));
  });
}

export function signIn(email: string, password: string): Promise<AuthTokens> {
  const details = new AuthenticationDetails({ Username: normalize(email), Password: password });
  return new Promise((resolve, reject) => {
    userFor(email).authenticateUser(details, {
      onSuccess: (session) => resolve(tokensFromSession(session)),
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error('A password change is required for this account.')),
    });
  });
}

export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    userFor(email).forgotPassword({ onSuccess: () => resolve(), onFailure: (err) => reject(err) });
  });
}

export function confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
  return new Promise((resolve, reject) => {
    userFor(email).confirmPassword(code.trim(), newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

// Mint a fresh session from a stored refresh token (email is the Cognito username).
export function refresh(email: string, refreshToken: string): Promise<AuthTokens> {
  const token = new CognitoRefreshToken({ RefreshToken: refreshToken });
  return new Promise((resolve, reject) => {
    userFor(email).refreshSession(token, (err, session) =>
      err ? reject(err) : resolve(tokensFromSession(session)),
    );
  });
}

export function signOut(email: string): void {
  userFor(email).signOut();
}

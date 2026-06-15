export type AuthTokens = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  sub: string;
  username: string; // cognito:username — the value used to refresh the session
  email?: string;
};

export type Provider = 'google' | 'apple';

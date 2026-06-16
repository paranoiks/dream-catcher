export type AuthTokens = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  sub: string;
  email?: string;
};

export type Session = {
  tokens: AuthTokens;
  user: AuthUser;
  expiresAt: number; // ms epoch when the id/access token expires
};

export type Provider = 'google' | 'apple';

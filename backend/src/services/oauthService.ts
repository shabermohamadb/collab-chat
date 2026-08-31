import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export interface OAuthProfile {
  provider: 'google' | 'github';
  providerAccountId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  accessToken?: string;
  refreshToken?: string;
}

// Generate secure random state token for CSRF protection
export const generateOAuthState = (): string => {
  return crypto.randomBytes(24).toString('hex');
};

// =================== GOOGLE OAUTH 2.0 ===================

export const getGoogleAuthUrl = (state: string, redirectUri: string): string => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId || clientId.includes('example.apps.googleusercontent.com') || clientId.includes('your_google_client_id')) {
    throw new Error('Google OAuth credentials not configured. Please paste your GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in .env.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const handleGoogleCallback = async (code: string, redirectUri: string): Promise<OAuthProfile> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId.includes('example.apps.googleusercontent.com')) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are missing or invalid.');
  }

  // 1. Exchange authorization code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    logger.error('Google token exchange failed:', errorData);
    throw new Error('Failed to exchange authorization code with Google.');
  }

  const tokenData = (await tokenResponse.json()) as any;
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  // 2. Fetch user profile from Google UserInfo endpoint
  const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userinfoResponse.ok) {
    throw new Error('Failed to fetch user profile from Google.');
  }

  const profileData = (await userinfoResponse.json()) as any;

  if (!profileData.email) {
    throw new Error('Google account does not provide an email address.');
  }

  return {
    provider: 'google',
    providerAccountId: profileData.sub,
    email: profileData.email.toLowerCase().trim(),
    name: profileData.name || profileData.email.split('@')[0],
    avatarUrl: profileData.picture,
    emailVerified: !!profileData.email_verified,
    accessToken,
    refreshToken,
  };
};

// =================== GITHUB OAUTH ===================

export const getGitHubAuthUrl = (state: string, redirectUri: string): string => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId || clientId.includes('your_github_oauth_client_id')) {
    throw new Error('GitHub OAuth credentials not configured. Please paste your GITHUB_CLIENT_ID & GITHUB_CLIENT_SECRET in .env.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user:email read:user',
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

export const handleGitHubCallback = async (code: string, redirectUri: string): Promise<OAuthProfile> => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId.includes('your_github_oauth_client_id')) {
    throw new Error('GitHub OAuth credentials (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET) are missing or invalid.');
  }

  // 1. Exchange authorization code for token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    logger.error('GitHub token exchange failed:', errorData);
    throw new Error('Failed to exchange authorization code with GitHub.');
  }

  const tokenData = (await tokenResponse.json()) as any;
  if (tokenData.error) {
    throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
  }

  const accessToken = tokenData.access_token;

  // 2. Fetch user profile from GitHub API
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'CollabSpace-App',
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch user profile from GitHub.');
  }

  const githubUser = (await userResponse.json()) as any;

  // 3. Fetch user emails if primary email is private
  let email = githubUser.email;
  let emailVerified = false;

  if (!email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'CollabSpace-App',
      },
    });

    if (emailsResponse.ok) {
      const emailsList = (await emailsResponse.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
      const primaryEmail = emailsList.find((e) => e.primary) || emailsList[0];
      if (primaryEmail) {
        email = primaryEmail.email;
        emailVerified = primaryEmail.verified;
      }
    }
  } else {
    emailVerified = true;
  }

  if (!email) {
    throw new Error('GitHub account has no accessible verified email address.');
  }

  return {
    provider: 'github',
    providerAccountId: String(githubUser.id),
    email: email.toLowerCase().trim(),
    name: githubUser.name || githubUser.login,
    avatarUrl: githubUser.avatar_url,
    emailVerified,
    accessToken,
  };
};

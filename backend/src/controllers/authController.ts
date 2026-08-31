import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import * as authService from '../services/authService.js';
import * as oauthService from '../services/oauthService.js';
import { setSessionCookie, clearSessionCookie, validateDatabaseSession } from '../utils/session.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const registerSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  username: z.string().optional(),
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  confirmPassword: z.string().min(6).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const register = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    const result = await authService.registerUser(validated as any);

    // Set secure HttpOnly session cookie
    setSessionCookie(res, result.sessionToken);

    return res.status(201).json({
      authenticated: true,
      user: result.user,
      sessionToken: result.sessionToken,
      token: result.token,
      message: 'Account registered successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const result = await authService.loginUser(validated as any);

    // Set secure HttpOnly session cookie
    setSessionCookie(res, result.sessionToken);

    return res.status(200).json({
      authenticated: true,
      user: result.user,
      sessionToken: result.sessionToken,
      token: result.token,
      message: 'Logged in successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// =================== GOOGLE OAUTH REDIRECT & CALLBACK ===================

export const googleRedirect = (req: AuthenticatedRequest, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const state = oauthService.generateOAuthState();
    res.cookie('oauth_state_google', state, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });

    const googleUrl = oauthService.getGoogleAuthUrl(state);
    logger.info('[GOOGLE DEBUG] REDIRECTING_TO_AUTH_URL=true');
    return res.redirect(googleUrl);
  } catch (error: any) {
    logger.error('[GOOGLE DEBUG] Error generating auth URL:', error);
    return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(error.message || 'Google OAuth is not configured yet')}`);
  }
};

export const googleCallback = async (req: AuthenticatedRequest, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { code, state, error } = req.query;

  logger.info('[GOOGLE DEBUG] CALLBACK_RECEIVED=true');

  if (error) {
    logger.warn(`[GOOGLE DEBUG] OAuth callback error: ${error}`);
    return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(String(error))}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}?auth_error=Missing authorization code`);
  }

  try {
    const profile = await oauthService.handleGoogleCallback(String(code));
    const result = await authService.linkOrFindOAuthUser(profile);

    // Set secure HttpOnly session cookie on port 5000
    setSessionCookie(res, result.sessionToken);
    res.clearCookie('oauth_state_google');

    logger.info(`[GOOGLE DEBUG] REDIRECTING=true userId=${result.user.id}`);
    // Pass sessionToken in URL query so frontend can also sync token into localStorage
    return res.redirect(`${frontendUrl}?token=${result.sessionToken}&auth_success=true`);
  } catch (err: any) {
    logger.error('[GOOGLE DEBUG] Authentication failed:', err);
    return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(err.message || 'Google authentication failed')}`);
  }
};

// =================== GITHUB OAUTH REDIRECT & CALLBACK ===================

export const githubRedirect = (req: AuthenticatedRequest, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const state = oauthService.generateOAuthState();
    res.cookie('oauth_state_github', state, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });

    const githubUrl = oauthService.getGitHubAuthUrl(state);
    logger.info('[GITHUB DEBUG] REDIRECTING_TO_AUTH_URL=true');
    return res.redirect(githubUrl);
  } catch (error: any) {
    logger.error('[GITHUB DEBUG] Error generating auth URL:', error);
    return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(error.message || 'GitHub OAuth is not configured yet')}`);
  }
};

export const githubCallback = async (req: AuthenticatedRequest, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { code, error } = req.query;

  logger.info('[GITHUB DEBUG] CALLBACK_RECEIVED=true');

  if (error) {
    return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(String(error))}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}?auth_error=Missing authorization code`);
  }

  try {
    const profile = await oauthService.handleGitHubCallback(String(code));
    const result = await authService.linkOrFindOAuthUser(profile);

    setSessionCookie(res, result.sessionToken);
    res.clearCookie('oauth_state_github');

    logger.info(`[GITHUB DEBUG] REDIRECTING=true userId=${result.user.id}`);
    return res.redirect(`${frontendUrl}?token=${result.sessionToken}&auth_success=true`);
  } catch (err: any) {
    return res.redirect(`${frontendUrl}?auth_error=${encodeURIComponent(err.message || 'GitHub authentication failed')}`);
  }
};

// =================== ME, LOGOUT & DISCONNECT ===================

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionCookie = req.cookies?.session_token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const token = sessionCookie || bearerToken;

    if (!token) {
      logger.info('[AUTH DEBUG] /me session found: false');
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    const authUser = await validateDatabaseSession(token);
    if (!authUser) {
      logger.info('[AUTH DEBUG] /me session found: false (invalid or expired token)');
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    const userProfile = await authService.getUserProfileAndAccounts(authUser.id);
    if (!userProfile) {
      logger.info('[AUTH DEBUG] /me user account not found in DB');
      return res.status(200).json({
        authenticated: false,
        user: null,
      });
    }

    logger.info(`[AUTH DEBUG] /me session found: true, authenticated user: ${userProfile.username}`);
    return res.status(200).json({
      authenticated: true,
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessionCookie = req.cookies?.session_token;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const token = sessionCookie || bearerToken;

    await authService.logoutUser(token, req.user?.id);
    clearSessionCookie(res);

    logger.info('[AUTH DEBUG] User logged out and session destroyed.');
    return res.status(200).json({
      authenticated: false,
      user: null,
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const disconnectProvider = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    if (!provider) {
      return sendError(res, 'Provider is required.', 400);
    }
    const result = await authService.disconnectOAuthProvider(req.user!.id, provider);
    return sendSuccess(res, result, `Disconnected ${provider} successfully.`);
  } catch (error) {
    next(error);
  }
};

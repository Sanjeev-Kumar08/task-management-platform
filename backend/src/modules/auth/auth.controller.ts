import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/api/auth',
  });
}

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body, req.get('user-agent') ?? undefined);
      setRefreshCookie(res, result.refreshToken);
      sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken },
        'Registered successfully',
        201,
      );
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body, req.get('user-agent') ?? undefined);
      setRefreshCookie(res, result.refreshToken);
      sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken },
        'Logged in successfully',
      );
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      if (!token) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Refresh token missing' },
        });
        return;
      }
      const result = await authService.refresh(token);
      setRefreshCookie(res, result.refreshToken);
      sendSuccess(res, { accessToken: result.accessToken }, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      await authService.logout(token);
      clearRefreshCookie(res);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.me(req.user!.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.updateProfile(req.user!.id, req.body);
      sendSuccess(res, user, 'Profile updated');
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.changePassword(req.user!.id, req.body);
      clearRefreshCookie(res);
      sendSuccess(res, null, 'Password changed. Please sign in again.');
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(res, null, 'If that email exists, a reset link was sent');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      sendSuccess(res, null, 'Password reset successfully');
    } catch (err) {
      next(err);
    }
  },

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await authService.listSessions(req.user!.id);
      sendSuccess(res, sessions);
    } catch (err) {
      next(err);
    }
  },

  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.revokeSession(req.user!.id, req.params.sessionId);
      sendSuccess(res, null, 'Session revoked');
    } catch (err) {
      next(err);
    }
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.deleteAccount(req.user!.id);
      clearRefreshCookie(res);
      sendSuccess(res, null, 'Account deleted');
    } catch (err) {
      next(err);
    }
  },
};

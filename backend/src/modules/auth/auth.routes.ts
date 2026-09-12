import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './auth.validation.js';
import { authenticate } from '../../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10_000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10_000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRoutes = Router();

authRoutes.use(authLimiter);

authRoutes.post('/register', validate(registerSchema), authController.register);
authRoutes.post('/login', validate(loginSchema), authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', authController.logout);
authRoutes.post(
  '/forgot-password',
  sensitiveLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
authRoutes.post(
  '/reset-password',
  sensitiveLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
authRoutes.get('/me', authenticate, authController.me);
authRoutes.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile,
);
authRoutes.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);
authRoutes.get('/sessions', authenticate, authController.listSessions);
authRoutes.delete('/sessions/:sessionId', authenticate, authController.revokeSession);
authRoutes.delete('/account', authenticate, authController.deleteAccount);

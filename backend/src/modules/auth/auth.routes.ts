import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema, registerSchema, updateProfileSchema } from './auth.validation.js';
import { authenticate } from '../../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRoutes = Router();

authRoutes.use(authLimiter);

authRoutes.post('/register', validate(registerSchema), authController.register);
authRoutes.post('/login', validate(loginSchema), authController.login);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', authController.logout);
authRoutes.get('/me', authenticate, authController.me);
authRoutes.patch(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile,
);

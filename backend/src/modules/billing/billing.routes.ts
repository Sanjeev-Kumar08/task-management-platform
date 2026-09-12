import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { billingController } from './billing.controller.js';

const checkoutSchema = z.object({
  planId: z.enum(['pro', 'business']),
});

export const billingRoutes = Router();

billingRoutes.get('/plans', billingController.plans);
billingRoutes.get('/subscription', authenticate, billingController.subscription);
billingRoutes.post(
  '/checkout',
  authenticate,
  validate(checkoutSchema),
  billingController.checkout,
);
billingRoutes.post('/portal', authenticate, billingController.portal);

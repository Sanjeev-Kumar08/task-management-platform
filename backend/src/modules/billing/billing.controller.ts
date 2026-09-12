import type { Request, Response, NextFunction } from 'express';
import { billingService } from './billing.service.js';
import { sendSuccess } from '../../utils/response.js';
import type { PlanId } from '../entitlements/plans.js';

export const billingController = {
  async plans(_req: Request, res: Response, next: NextFunction) {
    try {
      sendSuccess(res, billingService.listPlans());
    } catch (err) {
      next(err);
    }
  },

  async subscription(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await billingService.getSubscriptionForUser(req.user!.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const planId = req.body.planId as PlanId;
      const data = await billingService.createCheckoutSession(req.user!.id, planId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async portal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await billingService.createPortalSession(req.user!.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string | undefined;
      const rawBody = req.body as Buffer;
      const data = await billingService.handleWebhook(rawBody, signature);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};

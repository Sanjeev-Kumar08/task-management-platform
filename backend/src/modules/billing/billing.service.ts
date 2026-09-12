import Stripe from 'stripe';
import { getPrimaryClientUrl } from '../../config/cors.js';
import { env } from '../../config/env.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { User } from '../users/user.model.js';
import { BillingCustomer } from './billingCustomer.model.js';
import { Subscription } from './subscription.model.js';
import { WebhookEvent } from './webhookEvent.model.js';
import { PLAN_CATALOG, type PlanId } from '../entitlements/plans.js';
import { entitlementsService } from '../entitlements/entitlements.service.js';
import { auditService } from '../audit/audit.service.js';

function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

function priceForPlan(planId: PlanId): string | null {
  if (planId === 'pro') return env.STRIPE_PRICE_PRO || null;
  if (planId === 'business') return env.STRIPE_PRICE_BUSINESS || null;
  return null;
}

export const billingService = {
  listPlans() {
    return PLAN_CATALOG;
  },

  async getSubscriptionForUser(userId: string) {
    const sub = await Subscription.findOne({ ownerId: userId }).sort({ updatedAt: -1 }).lean();
    const { planId, limits } = await entitlementsService.getLimitsForOwner(userId);
    return {
      planId,
      limits,
      subscription: sub
        ? {
            id: String(sub._id),
            status: sub.status,
            planId: sub.planId,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            stripeSubscriptionId: sub.stripeSubscriptionId,
          }
        : {
            id: null,
            status: 'active',
            planId: 'free',
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            stripeSubscriptionId: null,
          },
      stripeEnabled: env.stripeEnabled,
    };
  },

  async ensureCustomer(userId: string): Promise<string> {
    const stripe = getStripe();
    if (!stripe) throw new ValidationError('Billing is not configured');

    const existing = await BillingCustomer.findOne({ userId });
    if (existing) return existing.stripeCustomerId;

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId },
    });

    await BillingCustomer.create({
      userId,
      stripeCustomerId: customer.id,
      email: user.email,
    });

    return customer.id;
  },

  async createCheckoutSession(userId: string, planId: PlanId) {
    const stripe = getStripe();
    if (!stripe) throw new ValidationError('Billing is not configured. Contact support or set Stripe keys.');
    if (planId === 'free') throw new ValidationError('Cannot checkout the free plan');

    const priceId = priceForPlan(planId);
    if (!priceId) throw new ValidationError(`Stripe price is not configured for ${planId}`);

    const customerId = await this.ensureCustomer(userId);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getPrimaryClientUrl()}/settings/billing?success=1`,
      cancel_url: `${getPrimaryClientUrl()}/settings/billing?canceled=1`,
      metadata: { userId, planId },
      subscription_data: { metadata: { userId, planId } },
    });

    return { url: session.url, sessionId: session.id };
  },

  async createPortalSession(userId: string) {
    const stripe = getStripe();
    if (!stripe) throw new ValidationError('Billing is not configured');
    const customerId = await this.ensureCustomer(userId);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getPrimaryClientUrl()}/settings/billing`,
    });
    return { url: session.url };
  },

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const stripe = getStripe();
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      throw new ValidationError('Stripe webhook is not configured');
    }
    if (!signature) throw new ValidationError('Missing Stripe signature');

    const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

    const seen = await WebhookEvent.findOne({ eventId: event.id });
    if (seen) return { received: true, duplicate: true };

    await WebhookEvent.create({ eventId: event.id, type: event.type });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = (session.metadata?.planId as PlanId) || 'pro';
        if (userId && session.subscription) {
          await Subscription.findOneAndUpdate(
            { ownerId: userId },
            {
              ownerId: userId,
              planId,
              status: 'active',
              stripeCustomerId: String(session.customer ?? ''),
              stripeSubscriptionId: String(session.subscription),
              cancelAtPeriodEnd: false,
            },
            { upsert: true, new: true },
          );
          await auditService.log({
            userId,
            action: 'BILLING_UPDATED',
            entity: 'Subscription',
            entityId: String(session.subscription),
            metadata: { planId, event: event.type },
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription & {
          current_period_end?: number;
        };
        const userId = sub.metadata?.userId;
        const planId = (sub.metadata?.planId as PlanId) || 'pro';
        if (userId) {
          const status =
            event.type === 'customer.subscription.deleted'
              ? 'canceled'
              : (sub.status as string);
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: sub.id },
            {
              ownerId: userId,
              planId: status === 'canceled' ? 'free' : planId,
              status: status === 'canceled' ? 'canceled' : sub.status,
              stripeCustomerId: String(sub.customer),
              stripeSubscriptionId: sub.id,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
            { upsert: true },
          );
          await auditService.log({
            userId,
            action: 'BILLING_UPDATED',
            entity: 'Subscription',
            entityId: sub.id,
            metadata: { status, event: event.type },
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string } | null;
        };
        const subId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        if (subId) {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subId },
            { status: 'past_due' },
          );
        }
        break;
      }
      default:
        break;
    }

    return { received: true, duplicate: false };
  },

  async assertBillingAdmin(userId: string): Promise<void> {
    // Billing is owned by the account (user), not workspace role.
    if (!userId) throw new ForbiddenError();
  },
};

import { request } from '@/lib/api';
import type { Plan, PlanId } from '@/types';

export interface SubscriptionPayload {
  planId: PlanId;
  stripeEnabled?: boolean;
  subscription: {
    id: string | null;
    status: string;
    planId: PlanId;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  };
}

export function listPlans() {
  return request<Plan[]>({ method: 'GET', url: '/api/billing/plans' });
}

export function getSubscription() {
  return request<SubscriptionPayload>({ method: 'GET', url: '/api/billing/subscription' });
}

export function createCheckout(planId: Exclude<PlanId, 'free'>) {
  return request<{ url: string }>({
    method: 'POST',
    url: '/api/billing/checkout',
    data: { planId },
  });
}

export function createPortal() {
  return request<{ url: string }>({ method: 'POST', url: '/api/billing/portal' });
}

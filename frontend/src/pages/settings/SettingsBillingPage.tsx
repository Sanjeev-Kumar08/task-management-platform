import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useUiStore } from '@/stores/uiStore';
import * as billingService from '@/services/billing.service';
import type { SubscriptionPayload } from '@/services/billing.service';
import type { Plan } from '@/types';

export function SettingsBillingPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<SubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      billingService.listPlans(),
      billingService.getSubscription() as Promise<SubscriptionPayload>,
    ])
      .then(([p, s]) => {
        if (cancelled) return;
        setPlans(p);
        setSub(s);
      })
      .catch((err) => {
        pushToast(err instanceof Error ? err.message : 'Failed to load billing', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pushToast]);

  const checkout = async (planId: 'pro' | 'business') => {
    setBusy(planId);
    try {
      const { url } = await billingService.createCheckout(planId);
      globalThis.location.assign(url);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Checkout failed', 'error');
      setBusy(null);
    }
  };

  const portal = async () => {
    setBusy('portal');
    try {
      const { url } = await billingService.createPortal();
      globalThis.location.assign(url);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Portal unavailable', 'error');
      setBusy(null);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading billing…</p>;

  const currentPlanId = sub?.planId ?? sub?.subscription?.planId ?? 'free';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Billing</h2>
        <p className="text-sm text-slate-500">
          Current plan: <strong className="capitalize">{currentPlanId}</strong>
          {sub?.subscription?.status ? ` (${sub.subscription.status})` : ''}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const current = currentPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <h3 className="font-display text-base font-semibold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-semibold">
                ${plan.priceMonthly}
                <span className="text-sm font-normal text-slate-500">/mo</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                <li>{plan.limits.maxWorkspaces} workspaces</li>
                <li>{plan.limits.maxMembersPerWorkspace} members / workspace</li>
                <li>{plan.limits.maxProjectsPerWorkspace} projects / workspace</li>
              </ul>
              <div className="mt-4">
                {current ? (
                  <Button size="sm" variant="secondary" disabled>
                    Current plan
                  </Button>
                ) : plan.id === 'free' ? null : (
                  <Button
                    size="sm"
                    loading={busy === plan.id}
                    onClick={() => void checkout(plan.id as 'pro' | 'business')}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {currentPlanId !== 'free' ? (
        <Button variant="secondary" loading={busy === 'portal'} onClick={() => void portal()}>
          Manage subscription
        </Button>
      ) : (
        <p className="text-xs text-slate-500">
          Free plan works without Stripe. Configure Stripe keys to enable paid upgrades.
        </p>
      )}
    </div>
  );
}

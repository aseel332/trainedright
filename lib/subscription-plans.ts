export type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  recommended?: boolean;
};

/**
 * Trainer membership plans offered at go-live. Only the free trial exists for
 * now — when real paid plans are introduced, add them here and the onboarding
 * subscription screen lists them automatically. While this holds a single
 * free plan, the screen also shows a "contact for details" card instead of
 * inventing paid tiers.
 */
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free-trial",
    name: "Free Trial",
    price: "₹0",
    cadence: "Launch offer",
    description:
      "List your profile and start getting leads at no cost while we roll out.",
    features: [
      "Full public profile & search listing",
      "Direct WhatsApp leads, zero commission",
      "Client reviews & transformations",
      "Real demand analytics",
    ],
    recommended: true,
  },
];

/** True once real paid tiers exist beyond the free trial. */
export const hasPaidSubscriptionPlans = subscriptionPlans.some(
  (plan) => plan.id !== "free-trial",
);

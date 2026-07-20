import type { ProfilePlan, TrainerProfileDraft } from "@/lib/trainer-profile";

/** "3 months" / "6 weeks" / "10 days" for a package duration in days. */
export function planDurationLabel(durationDays: number | null): string {
  if (!durationDays || durationDays <= 0) {
    return "";
  }
  if (durationDays % 30 === 0) {
    const months = durationDays / 30;
    return `${months} month${months > 1 ? "s" : ""}`;
  }
  if (durationDays % 7 === 0) {
    const weeks = durationDays / 7;
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }
  return `${durationDays} day${durationDays > 1 ? "s" : ""}`;
}

/** A friendly name for a package the trainer didn't name, e.g. "3-Month Plan". */
export function planDefaultName(plan: ProfilePlan): string {
  const days = plan.durationDays;
  if (days && days > 0) {
    if (days % 30 === 0) return `${days / 30}-Month Plan`;
    if (days % 7 === 0) return `${days / 7}-Week Plan`;
    return `${days}-Day Plan`;
  }
  return "Training Plan";
}

/** "3 days/week · 3 months" — the cadence line under a package name. */
export function planCadence(plan: ProfilePlan): string {
  const parts: string[] = [];
  if (plan.daysPerWeek && plan.daysPerWeek > 0) {
    parts.push(`${plan.daysPerWeek} day${plan.daysPerWeek > 1 ? "s" : ""}/week`);
  }
  const duration = planDurationLabel(plan.durationDays);
  if (duration) {
    parts.push(duration);
  }
  return parts.join(" · ");
}

/** One pricing card to show, in display order. `amount === null` means free. */
export type PricingDisplayItem = {
  id: string;
  name: string;
  description: string;
  amount: number | null;
  unit: string;
  highlighted: boolean;
};

/**
 * The pricing cards for a profile, in order: free trial (if offered), the
 * single-session fee, then each package. This is the single source of truth
 * used by the live preview and by the publish pipeline, so the dashboard and
 * the public page always agree.
 */
export function draftPricingItems(
  profile: TrainerProfileDraft,
): PricingDisplayItem[] {
  const items: PricingDisplayItem[] = [];

  if (profile.offersFreeTrial) {
    items.push({
      id: "free-trial",
      name: "Free trial",
      description: "First session — meet, assess, and plan",
      amount: null,
      unit: "first session",
      highlighted: true,
    });
  }

  if (profile.perSessionFee && profile.perSessionFee > 0) {
    items.push({
      id: "per-session",
      name: "Single session",
      description: "Pay as you go",
      amount: Math.round(profile.perSessionFee),
      unit: "per session",
      highlighted: false,
    });
  }

  for (const plan of profile.plans) {
    if (plan.totalAmount === null || plan.totalAmount <= 0) {
      continue;
    }
    items.push({
      id: plan.id,
      name: plan.name.trim() || planDefaultName(plan),
      description: planCadence(plan) || "Custom package",
      amount: Math.round(plan.totalAmount),
      unit: "total",
      highlighted: false,
    });
  }

  return items;
}

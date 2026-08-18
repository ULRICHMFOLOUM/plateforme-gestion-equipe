/**
 * lib/subscription.ts
 * Utilitaire de gestion des abonnements et contrôle d'accès
 */

export type PlanType = "TRIAL" | "FREE" | "PRO" | "ENTERPRISE";
export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELED" | "INACTIVE";

// ─── Tarifs ────────────────────────────────────────────────────────────────
export const PLAN_PRICES = {
  FREE: { monthly: 0, yearly: 0 },
  PRO: { monthly: 10000, yearly: 100000 },     // FCFA
  ENTERPRISE: { monthly: 50000, yearly: 500000 }, // FCFA
};

// ─── Limites par plan ───────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  TRIAL: {
    maxProjects: Infinity,
    maxMembersPerProject: Infinity,
    advancedReports: true,
    videoConferences: true,
    customRoles: true,
    label: "Essai gratuit",
    badge: "🎁 Essai",
    color: "from-purple-500 to-indigo-500",
  },
  FREE: {
    maxProjects: 3,
    maxMembersPerProject: 5,
    advancedReports: false,
    videoConferences: false,
    customRoles: false,
    label: "Gratuit",
    badge: "Gratuit",
    color: "from-slate-400 to-slate-500",
  },
  PRO: {
    maxProjects: Infinity,
    maxMembersPerProject: Infinity,
    advancedReports: true,
    videoConferences: true,
    customRoles: false,
    label: "Pro",
    badge: "⚡ Pro",
    color: "from-blue-500 to-cyan-500",
  },
  ENTERPRISE: {
    maxProjects: Infinity,
    maxMembersPerProject: Infinity,
    advancedReports: true,
    videoConferences: true,
    customRoles: true,
    label: "Entreprise",
    badge: "🏆 Entreprise",
    color: "from-orange-500 to-red-500",
  },
};

// ─── Vérification d'accès utilisateur ─────────────────────────────────────
export interface UserSubscriptionData {
  plan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: Date | string | null;
  subscriptionEndsAt?: Date | string | null;
  isInternalAccount?: boolean;
}

export function getEffectivePlan(user: UserSubscriptionData): PlanType {
  // Les comptes internes (Novastack) ont toujours accès complet
  if (user.isInternalAccount) return "ENTERPRISE";

  const now = new Date();

  // Vérifier si l'essai est encore valide
  if (user.plan === "TRIAL") {
    if (user.trialEndsAt && new Date(user.trialEndsAt) > now) {
      return "TRIAL";
    }
    // Essai expiré → FREE
    return "FREE";
  }

  // Pour PRO et ENTERPRISE, vérifier la date d'expiration
  if (user.plan === "PRO" || user.plan === "ENTERPRISE") {
    if (user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > now) {
      return user.plan;
    }
    // Abonnement expiré → FREE
    return "FREE";
  }

  return user.plan as PlanType;
}

export function getTrialDaysLeft(trialEndsAt?: Date | string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function canCreateProject(user: UserSubscriptionData, currentProjectCount: number): boolean {
  const plan = getEffectivePlan(user);
  const limit = PLAN_LIMITS[plan].maxProjects;
  return limit === Infinity || currentProjectCount < limit;
}

export function canUseFeature(user: UserSubscriptionData, feature: "advancedReports" | "videoConferences" | "customRoles"): boolean {
  const plan = getEffectivePlan(user);
  return PLAN_LIMITS[plan][feature];
}

// ─── Calcul de la date d'expiration après paiement ─────────────────────────
export function calculateExpirationDate(billingPeriod: "MONTHLY" | "YEARLY"): Date {
  const now = new Date();
  if (billingPeriod === "YEARLY") {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now;
}

// ─── Calcul de la date de fin d'essai (J+14) ──────────────────────────────
export function calculateTrialEndDate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 14);
  return now;
}

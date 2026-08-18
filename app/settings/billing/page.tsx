"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Crown, Users, Clock, CheckCircle2, XCircle, ArrowRight, ArrowLeft,
  CreditCard, RefreshCw, Star, Shield, AlertTriangle, CheckCircle, Loader2
} from "lucide-react";
import { PLAN_PRICES, PLAN_LIMITS, getEffectivePlan, getTrialDaysLeft } from "@/lib/subscription";

const PLANS = [
  {
    id: "FREE",
    name: "Gratuit",
    icon: Users,
    price: 0,
    yearlyPrice: 0,
    color: "from-slate-400 to-slate-500",
    border: "border-slate-200",
    features: ["3 projets max", "5 membres/projet", "Chat basique", "Calendrier", "Tâches"],
    notIncluded: ["Rapports avancés", "Visioconférence", "Membres illimités"],
    target: "Étudiants & Solos",
    cta: "Plan actuel",
  },
  {
    id: "PRO",
    name: "Pro",
    icon: Zap,
    price: 10000,
    yearlyPrice: 100000,
    color: "from-blue-500 to-cyan-500",
    border: "border-blue-200",
    popular: true,
    features: ["Projets illimités", "Membres illimités", "Rapports avancés", "Visioconférence", "Support prioritaire", "Chat avancé"],
    notIncluded: ["Rôles personnalisés"],
    target: "Startups & PME",
    cta: "Commencer avec Pro",
  },
  {
    id: "ENTERPRISE",
    name: "Entreprise",
    icon: Crown,
    price: 50000,
    yearlyPrice: 500000,
    color: "from-orange-500 to-red-500",
    border: "border-orange-200",
    features: ["Tout illimité", "Rapports avancés", "Visioconférence", "Rôles personnalisés", "2FA obligatoire", "Support dédié", "SLA garanti"],
    notIncluded: [],
    target: "Grandes entreprises",
    cta: "Passer à Entreprise",
  },
];

function BillingPageContent() {
  const { data: session, status, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const [billingPeriod, setBillingPeriod] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "failed">("idle");

  async function fetchData() {
    const [profileRes, historyRes] = await Promise.all([
      fetch("/api/user/profile"),
      fetch("/api/payments/history"),
    ]);
    const profile = await profileRes.json();
    const history = await historyRes.json();
    setUserInfo(profile);
    setPayments(history.payments || []);
  }

  // Vérification automatique après retour de Flutterwave
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const txRef = searchParams.get("tx_ref");
    const transactionId = searchParams.get("transaction_id");
    const flwStatus = searchParams.get("status");

    if (paymentStatus === "success" && txRef) {
      setVerificationStatus("verifying");
      fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_ref: txRef, transaction_id: transactionId, status: flwStatus }),
      })
        .then(r => r.json())
        .then(async data => {
          if (data.success) {
            setVerificationStatus("success");
            await fetchData();
            await updateSession(); // Rafraîchir la session NextAuth
          } else {
            setVerificationStatus("failed");
          }
        })
        .catch(() => setVerificationStatus("failed"));
    }

    fetchData();
  }, []);

  const effectivePlan = userInfo ? getEffectivePlan({
    plan: userInfo.plan,
    subscriptionStatus: userInfo.subscriptionStatus,
    trialEndsAt: userInfo.trialEndsAt,
    subscriptionEndsAt: userInfo.subscriptionEndsAt,
    isInternalAccount: userInfo.isInternalAccount,
  }) : "FREE";

  const trialDays = getTrialDaysLeft(userInfo?.trialEndsAt);

  async function handleSubscribe(plan: string) {
    if (plan === "FREE" || plan === effectivePlan) return;
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingPeriod }),
      });
      const data = await res.json();
      if (data.paymentLink) {
        window.open(data.paymentLink, "_blank");
      } else {
        alert("Erreur : " + (data.error || "Impossible d'initier le paiement"));
      }
    } catch {
      alert("Une erreur est survenue.");
    }
    setLoadingPlan(null);
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  if (status === "loading" || !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-slate-500" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Abonnement & Facturation</h1>
          <p className="text-slate-500">Gérez votre plan et vos paiements</p>
        </motion.div>

        {/* Verification Status Banner */}
        <AnimatePresence>
          {verificationStatus === "verifying" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-blue-50 border border-blue-200 text-blue-700 px-5 py-4 rounded-2xl mb-6 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              <div>
                <p className="font-bold">Vérification du paiement en cours...</p>
                <p className="text-sm text-blue-500">Nous confirmons votre paiement avec Fapshi (MTN / Orange Money), veuillez patienter.</p>
              </div>
            </motion.div>
          )}
          {verificationStatus === "success" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-2xl mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">🎉 Paiement confirmé ! Votre abonnement est activé.</p>
                <p className="text-sm text-emerald-600">Profitez de toutes les fonctionnalités de votre nouveau plan.</p>
              </div>
            </motion.div>
          )}
          {verificationStatus === "failed" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Impossible de confirmer le paiement automatiquement.</p>
                <p className="text-sm text-red-500">Si vous avez bien été débité, contactez le support. Sinon, réessayez.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Plan Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${
                effectivePlan === "TRIAL" ? "from-purple-500 to-indigo-600" :
                effectivePlan === "FREE" ? "from-slate-400 to-slate-500" :
                effectivePlan === "PRO" ? "from-blue-500 to-cyan-500" :
                "from-orange-500 to-red-500"
              } rounded-2xl flex items-center justify-center shadow-lg`}>
                {effectivePlan === "TRIAL" ? <Clock className="w-7 h-7 text-white" /> :
                 effectivePlan === "FREE" ? <Users className="w-7 h-7 text-white" /> :
                 effectivePlan === "PRO" ? <Zap className="w-7 h-7 text-white" /> :
                 <Crown className="w-7 h-7 text-white" />}
              </div>
              <div>
                {userInfo.isInternalAccount && (
                  <p className="text-xs font-black text-emerald-600 flex items-center gap-1 mb-1">
                    <Star className="w-3 h-3" /> Compte interne — Accès gratuit à vie
                  </p>
                )}
                <h2 className="text-xl font-black text-slate-900">
                  Plan {PLAN_LIMITS[effectivePlan]?.label}
                </h2>
                <p className="text-sm text-slate-500">
                  {effectivePlan === "TRIAL" ? `Essai gratuit — ${trialDays} jour(s) restant(s)` :
                   effectivePlan === "FREE" ? "Plan gratuit limité" :
                   `Expire le ${formatDate(userInfo.subscriptionEndsAt)}`}
                </p>
              </div>
            </div>
            {effectivePlan === "TRIAL" && trialDays <= 3 && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold">
                <AlertTriangle className="w-4 h-4" />
                Essai expire bientôt !
              </div>
            )}
          </div>
        </motion.div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100 flex">
            <button onClick={() => setBillingPeriod("MONTHLY")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${billingPeriod === "MONTHLY" ? "bg-blue-500 text-white shadow-md" : "text-slate-500"}`}>
              Mensuel
            </button>
            <button onClick={() => setBillingPeriod("YEARLY")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingPeriod === "YEARLY" ? "bg-blue-500 text-white shadow-md" : "text-slate-500"}`}>
              Annuel
              <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-lg text-[10px] font-black">-17%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan, i) => {
            const isCurrentPlan = effectivePlan === plan.id || (effectivePlan === "TRIAL" && plan.id === "PRO");
            const price = billingPeriod === "YEARLY" ? plan.yearlyPrice : plan.price;
            const PlanIcon = plan.icon;

            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative bg-white rounded-3xl border-2 shadow-lg p-6 ${plan.popular ? "border-blue-400 shadow-blue-500/10" : "border-slate-100"}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                      ⚡ Le plus populaire
                    </div>
                  </div>
                )}
                <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                  <PlanIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-400 font-medium mb-4">{plan.target}</p>

                <div className="mb-6">
                  {price === 0 ? (
                    <p className="text-4xl font-black text-slate-900">Gratuit</p>
                  ) : (
                    <div>
                      <p className="text-4xl font-black text-slate-900">
                        {price.toLocaleString("fr-FR")}
                        <span className="text-base font-medium text-slate-400 ml-1">FCFA</span>
                      </p>
                      <p className="text-xs text-slate-400">{billingPeriod === "YEARLY" ? "/ an" : "/ mois"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                  {plan.notIncluded.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-400">
                      <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={plan.id === "FREE" || loadingPlan !== null || userInfo.isInternalAccount}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                    ${effectivePlan === plan.id ? "bg-slate-100 text-slate-400 cursor-default" :
                      plan.id === "FREE" ? "bg-slate-50 text-slate-400 cursor-default" :
                      `bg-gradient-to-r ${plan.color} text-white hover:shadow-lg hover:scale-[1.02]`}
                  `}
                >
                  {loadingPlan === plan.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : effectivePlan === plan.id ? (
                    <><CheckCircle2 className="w-4 h-4" /> Plan actuel</>
                  ) : (
                    <>{plan.cta} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-lg p-6">
            <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" /> Historique des paiements
            </h2>
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Plan {p.plan} — {p.billingPeriod === "MONTHLY" ? "Mensuel" : "Annuel"}</p>
                    <p className="text-xs text-slate-400">{formatDate(p.paidAt || p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{p.amount.toLocaleString("fr-FR")} FCFA</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {p.status === "SUCCESS" ? "Payé" : "En attente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <BillingPageContent />
    </Suspense>
  );
}


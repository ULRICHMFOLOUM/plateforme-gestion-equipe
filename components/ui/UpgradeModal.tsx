"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Crown, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export interface UpgradeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  reason?: string; // e.g. "maxProjects", "videoConferences", "advancedReports", "customRoles"
}

const PLANS = [
  {
    id: "PRO",
    name: "Pro",
    price: "10 000 FCFA",
    period: "/ mois",
    popular: true,
    color: "from-blue-500 to-cyan-500",
    badge: "⚡ Le plus populaire",
    features: [
      "Projets illimités",
      "Membres illimités",
      "Visioconférence HD intégrée",
      "Rapports avancés",
      "Support prioritaire 7j/7",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Entreprise",
    price: "50 000 FCFA",
    period: "/ mois",
    popular: false,
    color: "from-orange-500 to-red-500",
    badge: "🏆 Tout inclus",
    features: [
      "Tout du plan Pro illimité",
      "2FA TOTP obligatoire",
      "Rôles personnalisés",
      "SLA garanti & support dédié",
      "Accès API entreprise",
    ],
  },
];

export default function UpgradeModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  reason: externalReason,
}: UpgradeModalProps) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [reasonText, setReasonText] = useState<string>("Vous avez atteint la limite de votre plan d'abonnement.");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) externalOnClose();
    setInternalIsOpen(false);
  };

  // Listen to global openUpgradeModal event
  useEffect(() => {
    const handleGlobalEvent = (e: any) => {
      const reason = e.detail?.reason;
      if (reason === "maxProjects") {
        setReasonText("Vous avez atteint la limite maximale de projets pour votre plan (3 projets max sur le plan Gratuit).");
      } else if (reason === "videoConferences") {
        setReasonText("La visioconférence est réservée aux abonnés des plans Pro et Entreprise.");
      } else if (reason === "advancedReports") {
        setReasonText("Les rapports analytiques avancés nécessitent le plan Pro ou Entreprise.");
      } else if (e.detail?.message) {
        setReasonText(e.detail.message);
      } else {
        setReasonText("Vous avez atteint la limite autorisée par votre plan d'abonnement.");
      }
      setInternalIsOpen(true);
    };

    window.addEventListener("openUpgradeModal", handleGlobalEvent);
    return () => window.removeEventListener("openUpgradeModal", handleGlobalEvent);
  }, []);

  const handleSubscribe = async (plan: string) => {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingPeriod: "MONTHLY" }),
      });
      const data = await res.json();
      if (data.paymentLink) {
        window.open(data.paymentLink, "_blank");
      } else {
        router.push("/settings/billing");
      }
    } catch {
      router.push("/settings/billing");
    } finally {
      setLoadingPlan(null);
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-8"
          >
            {/* Top Bar */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white relative">
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                  Quota Atteint — Mise à Niveau
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white mb-2">
                Débloquez tout le potentiel de Teamflows
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
                {reasonText}
              </p>
            </div>

            {/* Plans Grid */}
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative bg-slate-50/70 rounded-2xl p-5 border-2 transition-all ${
                      plan.popular ? "border-blue-400 bg-blue-50/30" : "border-slate-200"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] font-black px-3 py-0.5 rounded-full shadow-sm">
                        {plan.badge}
                      </span>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-black text-slate-900 text-lg">{plan.name}</h3>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                          <span className="text-xs font-medium text-slate-500">{plan.period}</span>
                        </div>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-5">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loadingPlan !== null}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${plan.color} hover:opacity-95`}
                    >
                      {loadingPlan === plan.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Choisir {plan.name}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Bottom Link */}
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    handleClose();
                    router.push("/settings/billing");
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline transition-colors"
                >
                  Voir le tableau comparatif complet des tarifs &amp; abonnements
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

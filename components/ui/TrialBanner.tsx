"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ArrowRight, Zap } from "lucide-react";
import { getTrialDaysLeft } from "@/lib/subscription";

interface TrialBannerProps {
  plan: string;
  trialEndsAt?: string | null;
  isInternalAccount?: boolean;
}

export default function TrialBanner({ plan, trialEndsAt, isInternalAccount }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const daysLeft = getTrialDaysLeft(trialEndsAt);
  const showBanner = !isInternalAccount && plan === "TRIAL" && daysLeft <= 3 && !dismissed;

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-orange-400/30 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold tracking-wide">
            {daysLeft === 0
              ? "⚠️ Votre essai gratuit a expiré ! Passez à Pro pour continuer à utiliser toutes vos fonctionnalités."
              : `⏳ Votre essai gratuit expire dans ${daysLeft} jour(s). Passez à la formule Pro avec Fapshi Mobile Money.`}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => router.push("/settings/billing")}
            className="flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" /> Passer à Pro
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

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
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 flex items-center justify-between gap-4 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <p className="text-sm font-bold">
            {daysLeft === 0
              ? "⚠️ Votre essai gratuit a expiré ! Passez à Pro pour continuer."
              : `⏳ Votre essai gratuit expire dans ${daysLeft} jour(s). Passez à Pro pour ne rien perdre.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/settings/billing")}
            className="flex items-center gap-1.5 bg-white text-orange-600 px-3 py-1.5 rounded-xl text-xs font-black hover:bg-orange-50 transition-colors"
          >
            <Zap className="w-3 h-3" /> Passer à Pro
          </button>
          <button onClick={() => setDismissed(true)} className="text-white/70 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

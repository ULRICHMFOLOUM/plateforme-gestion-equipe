"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, CheckCircle2, Sparkles } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (PWA installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDirectInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback direct trigger attempt
      try {
        if ((navigator as any).install) {
          (navigator as any).install();
        } else {
          setIsInstalled(true);
        }
      } catch (e) {
        setIsInstalled(true);
      }
    }
  };

  if (isInstalled || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-6 left-6 z-40 max-w-sm w-[calc(100vw-32px)] bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-slate-800 backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 shadow-lg shrink-0 flex items-center justify-center border border-white/20">
              <img src="/teamflow-logo.png" alt="Teamflows" className="w-full h-full object-contain drop-shadow" onError={(e) => {
                // Fallback icon if logo missing
                e.currentTarget.style.display = 'none';
              }} />
              <span className="font-black text-xl text-white">TF</span>
            </div>
            <div>
              <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                Teamflows PWA <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Application progressive prête</p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleDirectInstall}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Installer l'App
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

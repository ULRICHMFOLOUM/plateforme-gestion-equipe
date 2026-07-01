"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface PageLoaderProps {
  children: React.ReactNode;
  isLoading: boolean;
}

export default function PageLoader({ children, isLoading }: PageLoaderProps) {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Sécurité : fermer le loader après 2.5 secondes quoi qu'il arrive
    const safetyTimer = setTimeout(() => setShowLoader(false), 2500);

    if (!isLoading) {
      const timer = setTimeout(() => setShowLoader(false), 50);
      return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
      };
    } else {
      setShowLoader(true);
    }
    return () => clearTimeout(safetyTimer);
  }, [isLoading]);

  return (
    <>
      <AnimatePresence>
        {showLoader && (
          <motion.div
            className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              filter: "blur(10px)",
              scale: 1.1,
            }}
            transition={{
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {/* Loader ultra-simplifié pour Firefox */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-600 font-medium">Chargement de votre espace...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu de la page : Toujours visible en arrière-plan pour éviter le blocage */}
      <div>
        {children}
      </div>
    </>
  );
}

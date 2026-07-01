"use client";

import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="relative">
        {/* Cercles d'arrière-plan animés */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl rounded-full"
        />
        
        <div className="relative flex flex-col items-center">
          {/* Spinner Principal */}
          <div className="relative w-16 h-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-full h-full border-4 border-slate-200 border-t-blue-600 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border-4 border-slate-200 border-b-cyan-500 rounded-full"
            />
          </div>

          {/* Texte de chargement */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col items-center"
          >
            <h3 className="text-lg font-display font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Chargement de votre espace
            </h3>
            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Cookie, ArrowLeft, Check, Info } from "lucide-react";

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 pt-16 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Cookie className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-blue-200 text-sm font-bold tracking-wider uppercase">Légal</span>
                <h1 className="text-3xl sm:text-4xl font-black text-white">Politique de Cookies</h1>
              </div>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">
              Informations relatives à l'utilisation des témoins de connexion (cookies) sur la plateforme TeamFlow.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-24 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Info className="w-6 h-6 text-blue-600" /> Qu'est-ce qu'un cookie ?
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            Un cookie est un petit fichier texte déposé sur votre navigateur lors de la visite d'un site web. Il permet de mémoriser vos préférences et de maintenir votre session active.
          </p>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900">Cookies utilisés sur TeamFlow :</h3>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-slate-800">Cookies de Session (NextAuth)</p>
                <p className="text-xs text-slate-500">Stricts et nécessaires pour vous maintenir connecté en toute sécurité.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-slate-800">Cookies de Préférences</p>
                <p className="text-xs text-slate-500">Mémorisent vos préférences d'interface (mode sombre/clair, langue).</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
          <Link href="/" className="hover:text-blue-600 transition-colors font-medium">Accueil</Link>
          <Link href="/privacy" className="hover:text-blue-600 transition-colors font-medium">Confidentialité</Link>
          <Link href="/terms" className="hover:text-blue-600 transition-colors font-medium">Conditions</Link>
        </div>
      </div>
    </div>
  );
}

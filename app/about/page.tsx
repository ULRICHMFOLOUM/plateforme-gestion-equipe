"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, ArrowLeft, Rocket, Target, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 pt-16 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-blue-200 text-sm font-bold tracking-wider uppercase">Notre Histoire</span>
                <h1 className="text-3xl sm:text-4xl font-black text-white">À propos de Teamflows</h1>
              </div>
            </div>
            <p className="text-blue-100 text-lg leading-relaxed max-w-2xl">
              Conçu par Novastack Digital pour offrir aux équipes modernes un espace de travail unifié, rapide et élégant.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-24 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-600" /> Notre Mission
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            Teamflows a été créé avec une vision claire : éliminer la fragmentation des outils de travail. Au lieu d'utiliser 5 applications différentes pour le chat, le Kanban, le calendrier, la visioconférence et la facturation, Teamflows rassemble tout dans un seul espace fluide et hyper-réactif.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <Rocket className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-black text-slate-900 text-lg">100%</p>
              <p className="text-xs text-slate-500 font-medium">Temps réel</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="font-black text-slate-900 text-lg">10 000+</p>
              <p className="text-xs text-slate-500 font-medium">Utilisateurs</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl text-center">
              <Heart className="w-6 h-6 text-pink-600 mx-auto mb-2" />
              <p className="font-black text-slate-900 text-lg">Novastack</p>
              <p className="text-xs text-slate-500 font-medium">Fait avec passion</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
          <Link href="/" className="hover:text-blue-600 transition-colors font-medium">Accueil</Link>
          <Link href="/privacy" className="hover:text-blue-600 transition-colors font-medium">Confidentialité</Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors font-medium">Contact</Link>
        </div>
      </div>
    </div>
  );
}

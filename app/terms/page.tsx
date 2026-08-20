"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, ArrowLeft, Shield, Scale, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 pt-16 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-blue-400 text-sm font-bold tracking-wider uppercase">Légal</span>
                <h1 className="text-3xl sm:text-4xl font-black text-white">Conditions Générales d'Utilisation</h1>
              </div>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
              Bienvenue sur Teamflows. En accédant ou en utilisant nos services, vous acceptez d'être lié par les présentes conditions.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Scale className="w-6 h-6 text-blue-600" /> 1. Objet et acceptation
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Teamflows développée par Novastack Digital.
            Tout accès à la plateforme implique l'acceptation sans réserve des présentes conditions par l'utilisateur.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" /> 2. Accès au service et création de compte
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            L'inscription nécessite une adresse email valide. Tout utilisateur est responsable de la confidentialité de ses identifiants et de l'ensemble des activités exécutées depuis son compte.
            Un essai gratuit de 14 jours est offert à toute nouvelle inscription sans obligation d'achat.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-blue-600" /> 3. Abonnements et paiements
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            Les paiements s'effectuent en Franc CFA (XAF) via notre partenaire agréé Fapshi (MTN Mobile Money, Orange Money et Carte bancaire).
            Les abonnements se renouvellent selon la périodicité choisie (mensuelle ou annuelle) et sont annulables à tout moment.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600" /> 4. Responsabilités
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            L'utilisateur s'interdit de publier du contenu illégal ou malveillant. Teamflows s'efforce de garantir une disponibilité du service à 99,9% mais ne saurait être tenu responsable des pannes indépendantes de sa volonté.
          </p>
        </motion.div>

        <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
          <Link href="/" className="hover:text-blue-600 transition-colors font-medium">Accueil</Link>
          <Link href="/privacy" className="hover:text-blue-600 transition-colors font-medium">Confidentialité</Link>
          <Link href="/cookies" className="hover:text-blue-600 transition-colors font-medium">Cookies</Link>
        </div>
      </div>
    </div>
  );
}

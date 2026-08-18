"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Server, Key, Eye } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 pt-16 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-cyan-400 text-sm font-bold tracking-wider uppercase">Infrastructure & Conformité</span>
                <h1 className="text-3xl sm:text-4xl font-black text-white">Sécurité des Données</h1>
              </div>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
              Comment nous protégeons vos données de projet, de communication et de paiement selon les plus hauts standards.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-24 space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900">Chiffrement TLS 1.3</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Toutes les données transitant entre le navigateur et la plateforme sont chiffrées de bout en bout.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900">Base PostgreSQL Dédiée</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Hébergée sur Neon Cloud avec sauvegardes automatiques et restauration en temps réel.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900">Double Authentification (2FA)</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Support natif TOTP (Google Authenticator, Authy) disponible pour tous les utilisateurs.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl space-y-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-900">Conformité PCI-DSS</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Paiements gérés par Flutterwave, certifié PCI-DSS Level 1.</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-slate-400 pt-6">
          <Link href="/" className="hover:text-blue-600 transition-colors font-medium">Accueil</Link>
          <Link href="/privacy" className="hover:text-blue-600 transition-colors font-medium">Confidentialité</Link>
          <Link href="/terms" className="hover:text-blue-600 transition-colors font-medium">Conditions</Link>
        </div>
      </div>
    </div>
  );
}

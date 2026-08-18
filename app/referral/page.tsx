"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift, Copy, Check, Share2, Users, DollarSign, Award,
  Sparkles, ArrowRight, ExternalLink, ShieldCheck, HelpCircle,
  MessageCircle, Send, CheckCircle2, Zap
} from "lucide-react";
import Link from "next/link";
import { SectionTransition } from "@/components/PageTransition";

export default function ReferralPage() {
  const [data, setData] = useState<{
    referralCode: string;
    shareLink: string;
    referralBalance: number;
    totalReferrals: number;
    convertedReferrals: number;
    totalEarned: number;
    referrals: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/referral/stats")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Referral fetch error:", e);
        setLoading(false);
      });
  }, []);

  const handleCopy = () => {
    if (data?.shareLink) {
      navigator.clipboard.writeText(data.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!data?.shareLink) return;
    const msg = `Rejoins-moi sur TeamFlow, la meilleure plateforme de gestion d'équipe ! Utilise mon lien pour bénéficier de 15% de réduction sur ton abonnement : ${data.shareLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleShareEmail = () => {
    if (!data?.shareLink) return;
    const subject = "Invitation à rejoindre TeamFlow (15% de réduction offerte)";
    const body = `Bonjour,\n\nJe t'invite à découvrir TeamFlow Enterprise pour gérer tes projets et ton équipe avec fluidité.\n\nEn t'inscrivant avec mon lien de parrainage, tu reçois 15% de réduction immédiate sur ton abonnement :\n${data.shareLink}\n\nÀ très vite !`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  const handleClaimReward = async () => {
    if (!data || data.referralBalance <= 0) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/referral/claim", { method: "POST" });
      if (res.ok) {
        setClaimSuccess(true);
        setData((prev) => prev ? { ...prev, referralBalance: 0 } : null);
      }
    } catch (e) {
      console.error("Claim error:", e);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-6 lg:p-10 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <SectionTransition>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold mb-2">
              <Gift className="w-3.5 h-3.5" /> Programme Parrainage & Croissance
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Invitez vos proches, <span className="text-blue-600">gagnez ensemble</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Offrez 15% de réduction à vos filleuls et cumulez des mois d'abonnement offerts ou des crédits.
            </p>
          </div>

          {/* Balance Widget */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-3xl shadow-xl shadow-blue-500/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
              💎
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Solde Récompenses</p>
              <p className="text-2xl font-black">{data?.referralBalance.toLocaleString() || 0} XAF</p>
            </div>
          </div>
        </div>
      </SectionTransition>

      {/* ── HERO BANNER - SHARE CODE ── */}
      <SectionTransition delay={0.1}>
        <div className="relative bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-2xl font-black text-slate-900">
                Votre lien de parrainage exclusif
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Partagez votre lien. Chaque ami qui s'abonne à TeamFlow reçoit <strong className="text-blue-600">15% de réduction</strong> et vous crédite <strong className="text-indigo-600">2,000 XAF de récompense</strong> directe.
              </p>

              {/* Copy input bar */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                <input
                  type="text"
                  readOnly
                  value={loading ? "Chargement..." : data?.shareLink || ""}
                  className="bg-transparent text-sm font-mono text-slate-700 font-bold px-3 flex-1 focus:outline-none truncate"
                />
                <button
                  onClick={handleCopy}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copié !" : "Copier le lien"}
                </button>
              </div>

              {/* Quick share buttons */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-slate-400">Partager via :</span>
                <button
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-2 border border-emerald-200 transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" /> WhatsApp
                </button>
                <button
                  onClick={handleShareEmail}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-2 border border-blue-200 transition-all"
                >
                  <Send className="w-4 h-4 text-blue-600" /> Email
                </button>
              </div>
            </div>

            {/* Code Box Display */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl text-center relative overflow-hidden shadow-2xl">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl" />
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Votre Code de Parrainage</p>
              <div className="text-3xl lg:text-4xl font-black font-mono tracking-widest text-white py-3 px-4 bg-white/10 rounded-2xl border border-white/10 my-3 inline-block select-all">
                {data?.referralCode || "TF-..."}
              </div>
              <p className="text-xs text-slate-400">À faire saisir sur la page de paiement lors de l'abonnement.</p>
            </div>
          </div>
        </div>
      </SectionTransition>

      {/* ── STAT CARDS ── */}
      <SectionTransition delay={0.2}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/30">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filleuls inscrits</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{data?.totalReferrals || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/30">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abonnés payants</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{data?.convertedReferrals || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/30">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gains cumulés</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{(data?.totalEarned || 0).toLocaleString()} XAF</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/30">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Réduction filleul</p>
            <p className="text-3xl font-black text-slate-900 mt-1">15%</p>
          </div>
        </div>
      </SectionTransition>

      {/* ── HOW IT WORKS ── */}
      <SectionTransition delay={0.3}>
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 mb-8">
          <h2 className="text-xl font-black text-slate-900 text-center mb-8">
            Comment fonctionne le parrainage en 3 étapes simples ?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-2xl font-black mb-4 shadow-md">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Partagez votre lien</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Envoyez votre lien ou code exclusif à vos contacts entrepreneurs, collègues ou étudiants.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-2xl font-black mb-4 shadow-md">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Votre ami s'abonne</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Il bénéficie immédiatement de 15% de réduction sur son abonnement PRO ou ENTERPRISE.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-2xl font-black mb-4 shadow-md">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Recevez votre récompense</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vous recevez 2,000 XAF crédités sur votre compte pour réduire le coût de votre propre abonnement.
              </p>
            </div>
          </div>
        </div>
      </SectionTransition>

      {/* ── REFERRALS LIST TABLE ── */}
      <SectionTransition delay={0.4}>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900 text-lg">Vos Filleuls</h2>
              <p className="text-xs text-slate-400">Historique des personnes ayant rejoint via votre invitation</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Date d'inscription</th>
                  <th className="px-6 py-4">Offre</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.referrals && data.referrals.length > 0 ? (
                  data.referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {r.name} <span className="text-xs font-normal text-slate-400">({r.emailMasked})</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                          {r.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          r.status === "CONVERTED" || r.status === "REWARDED"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-amber-50 text-amber-600 border border-amber-200"
                        }`}>
                          {r.status === "CONVERTED" || r.status === "REWARDED" ? "Abonné Payant" : "En attente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">
                        +{r.rewardAmount || 0} XAF
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Vous n'avez pas encore de filleul.</p>
                      <p className="text-xs text-slate-400 mt-1">Partagez votre lien de parrainage ci-dessus pour commencer !</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SectionTransition>
    </div>
  );
}

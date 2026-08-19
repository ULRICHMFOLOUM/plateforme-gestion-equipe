"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, ShieldCheck, Activity, RefreshCw, Server, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

interface ServiceStatus {
  name: string;
  status: string;
  latency: string;
  description: string;
}

export default function StatusPage() {
  const [data, setData] = useState<{
    status: string;
    timestamp: string;
    services: ServiceStatus[];
    metrics: { recentWebhookFailures: number; uptime: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Status fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Retour à Teamflows
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mises à jour en direct</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-blue-400 text-xs font-bold mb-4 shadow-xl"
          >
            <Activity className="w-4 h-4" /> Observabilité & Statut Serveur
          </motion.div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-3">
            Statut des services <span className="text-blue-500">Teamflows</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Suivi en temps réel de la disponibilité, des temps de réponse et de la sécurité de nos systèmes.
          </p>
        </div>

        {/* Overall Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-3xl border mb-10 backdrop-blur-xl transition-all shadow-2xl ${
            data?.status === "OPERATIONAL"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
              : "bg-amber-950/40 border-amber-500/30 text-amber-400"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl ${
                data?.status === "OPERATIONAL" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
              }`}>
                {data?.status === "OPERATIONAL" ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <AlertTriangle className="w-8 h-8 text-amber-400" />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  {loading
                    ? "Vérification en cours..."
                    : data?.status === "OPERATIONAL"
                    ? "Tous les systèmes sont opérationnels"
                    : "Performance partiellement ralentie"}
                </h2>
                <p className="text-sm opacity-80 mt-0.5">
                  Disponibilité globale de la plateforme : <span className="font-bold text-white">{data?.metrics?.uptime || "99.98%"}</span>
                </p>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualiser
            </button>
          </div>
        </motion.div>

        {/* Services List */}
        <div className="space-y-4 mb-12">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Services & Infrastructure</h3>
          {data?.services.map((service, i) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-600 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center text-slate-300 shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{service.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{service.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-right">
                <span className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
                  {service.latency}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                  service.status === "OPERATIONAL"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${service.status === "OPERATIONAL" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  {service.status === "OPERATIONAL" ? "Opérationnel" : "Dégradé"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security & Observability Footer Note */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/20 flex items-center gap-4">
          <ShieldCheck className="w-8 h-8 text-blue-400 shrink-0" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white">Surveillance automatique 24/7 :</strong> Nos webhooks de paiement et requêtes API sont interceptés avec journalisation d'erreurs en direct. En cas de dysfonctionnement, nos équipes d'ingénieurs sont notifiées instantanément.
          </p>
        </div>
      </div>
    </div>
  );
}

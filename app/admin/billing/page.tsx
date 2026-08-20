"use client";

import { useState, useEffect } from "react";
import {
  Shield, Search, ChevronDown, Users, CreditCard, TrendingUp,
  ToggleLeft, ToggleRight, Star, Clock, CheckCircle, XCircle,
  Loader2, AlertCircle, RefreshCw, Crown, Zap, Building2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLAN_COLORS: Record<string, string> = {
  TRIAL: "bg-purple-100 text-purple-700 border-purple-200",
  FREE: "bg-slate-100 text-slate-600 border-slate-200",
  PRO: "bg-blue-100 text-blue-700 border-blue-200",
  ENTERPRISE: "bg-orange-100 text-orange-700 border-orange-200",
};

const PLAN_ICONS: Record<string, any> = {
  TRIAL: Clock,
  FREE: Users,
  PRO: Zap,
  ENTERPRISE: Crown,
};

const PLAN_LABELS: Record<string, string> = {
  TRIAL: "Essai",
  FREE: "Gratuit",
  PRO: "Pro",
  ENTERPRISE: "Entreprise",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-emerald-600 bg-emerald-50",
  EXPIRED: "text-red-600 bg-red-50",
  CANCELED: "text-slate-500 bg-slate-50",
  INACTIVE: "text-yellow-600 bg-yellow-50",
};

export default function AdminBillingPage() {
  const [tab, setTab] = useState<"subscriptions" | "payments">("subscriptions");
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, trial: 0, free: 0, pro: 0, enterprise: 0, internal: 0 });

  async function fetchSubscriptions() {
    setLoading(true);
    const params = new URLSearchParams({ search, ...(planFilter && { plan: planFilter }) });
    const res = await fetch(`/api/admin/subscriptions?${params}`);
    const data = await res.json();
    setUsers(data.users || []);

    // Calcul stats
    const all = data.users || [];
    setStats({
      total: data.total || 0,
      trial: all.filter((u: any) => u.plan === "TRIAL").length,
      free: all.filter((u: any) => u.plan === "FREE").length,
      pro: all.filter((u: any) => u.plan === "PRO").length,
      enterprise: all.filter((u: any) => u.plan === "ENTERPRISE").length,
      internal: all.filter((u: any) => u.isInternalAccount).length,
    });
    setLoading(false);
  }

  async function fetchPayments() {
    const res = await fetch("/api/admin/payments");
    const data = await res.json();
    setPayments(data.payments || []);
    setTotalRevenue(data.totalRevenue || 0);
  }

  useEffect(() => { fetchSubscriptions(); }, [search, planFilter]);
  useEffect(() => { fetchPayments(); }, []);

  async function toggleInternalAccount(userId: string, current: boolean) {
    setUpdatingId(userId);
    await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isInternalAccount: !current }),
    });
    await fetchSubscriptions();
    setUpdatingId(null);
  }

  async function changePlan(userId: string, plan: string) {
    setUpdatingId(userId);
    await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, plan }),
    });
    await fetchSubscriptions();
    setUpdatingId(null);
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const formatAmount = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Gestion des Abonnements</h1>
              <p className="text-sm text-slate-500">Gérez les plans, paiements et accès internes</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, icon: Users, color: "from-slate-600 to-slate-700" },
            { label: "Essai", value: stats.trial, icon: Clock, color: "from-purple-500 to-indigo-500" },
            { label: "Gratuit", value: stats.free, icon: Users, color: "from-slate-400 to-slate-500" },
            { label: "Pro", value: stats.pro, icon: Zap, color: "from-blue-500 to-cyan-500" },
            { label: "Entreprise", value: stats.enterprise, icon: Crown, color: "from-orange-500 to-red-500" },
            { label: "Interne", value: stats.internal, icon: Star, color: "from-emerald-500 to-teal-500" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className={`w-8 h-8 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue Card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 mb-8 shadow-xl shadow-emerald-500/20 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Revenus confirmés</p>
              <p className="text-3xl font-black">{formatAmount(totalRevenue)}</p>
              <p className="text-emerald-200 text-xs mt-1">Paiements Fapshi réussis</p>
            </div>
            <TrendingUp className="w-12 h-12 text-emerald-200/50" />
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1 shadow-sm border border-slate-100 w-fit">
          {[
            { key: "subscriptions", label: "Abonnements", icon: Users },
            { key: "payments", label: "Paiements", icon: CreditCard },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.key ? "bg-indigo-500 text-white shadow-md" : "text-slate-500 hover:text-slate-700"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Subscriptions Tab ── */}
          {tab === "subscriptions" && (
            <motion.div key="subs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Rechercher par email ou nom..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40" />
                </div>
                <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                  <option value="">Tous les plans</option>
                  <option value="TRIAL">Essai</option>
                  <option value="FREE">Gratuit</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Entreprise</option>
                </select>
                <button onClick={fetchSubscriptions} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Utilisateur</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Plan</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Statut</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Expiration</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Projets</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Interne</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {users.map(user => {
                          const PlanIcon = PLAN_ICONS[user.plan] || Users;
                          return (
                            <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${user.isInternalAccount ? "bg-emerald-50/30" : ""}`}>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{user.name || "—"}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                  </div>
                                  {user.isInternalAccount && (
                                    <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">INTERNE</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  value={user.plan}
                                  disabled={updatingId === user.id}
                                  onChange={e => changePlan(user.id, e.target.value)}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer ${PLAN_COLORS[user.plan]}`}
                                >
                                  <option value="TRIAL">🎁 Essai</option>
                                  <option value="FREE">Gratuit</option>
                                  <option value="PRO">⚡ Pro</option>
                                  <option value="ENTERPRISE">🏆 Entreprise</option>
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${STATUS_COLORS[user.subscriptionStatus] || "text-slate-500 bg-slate-50"}`}>
                                  {user.subscriptionStatus}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <p className="text-xs text-slate-600 font-medium">
                                  {user.plan === "TRIAL" ? formatDate(user.trialEndsAt) : formatDate(user.subscriptionEndsAt)}
                                </p>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-sm font-bold text-slate-700">{user._count?.ownedProjects ?? 0}</span>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => toggleInternalAccount(user.id, user.isInternalAccount)}
                                  disabled={updatingId === user.id}
                                  className="flex items-center gap-1.5 text-xs font-bold transition-all"
                                >
                                  {updatingId === user.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                  ) : user.isInternalAccount ? (
                                    <ToggleRight className="w-8 h-5 text-emerald-500" />
                                  ) : (
                                    <ToggleLeft className="w-8 h-5 text-slate-300" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${user.role === "ADMIN" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-500"}`}>
                                  {user.role}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {users.length === 0 && !loading && (
                      <div className="text-center py-16 text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">Aucun utilisateur trouvé</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Payments Tab ── */}
          {tab === "payments" && (
            <motion.div key="pays" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Utilisateur</th>
                      <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Montant</th>
                      <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Ref. Fapshi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-black">
                              {p.user?.name?.charAt(0)?.toUpperCase() || p.user?.email?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{p.user?.name}</p>
                              <p className="text-xs text-slate-400">{p.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded-lg border ${PLAN_COLORS[p.plan]}`}>{PLAN_LABELS[p.plan]}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold text-slate-900">{p.amount.toLocaleString("fr-FR")} FCFA</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full w-fit ${p.status === "SUCCESS" ? "bg-emerald-50 text-emerald-600" : p.status === "PENDING" ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600"}`}>
                            {p.status === "SUCCESS" ? <CheckCircle className="w-3 h-3" /> : p.status === "PENDING" ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 font-medium">{formatDate(p.paidAt || p.createdAt)}</td>
                        <td className="px-4 py-4 text-xs text-slate-400 font-mono">{p.flwRef || p.transactionId || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Aucun paiement enregistré</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

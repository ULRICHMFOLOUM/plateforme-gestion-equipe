"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import {
  Users, Shield, BarChart3, Search, Filter, CheckCircle, Clock,
  UserCheck, UserX, Plus, Mail, Calendar as CalendarIcon, FileText,
  Download, PieChart, Activity, Lock, Settings, Key, Zap,
  Server, CheckCircle2, AlertTriangle, RefreshCw, Wifi,
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionTransition, StaggeredList } from "@/components/PageTransition";
import UserAvatar from "@/components/ui/UserAvatar";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import { showToast } from "@/components/ui/Toast";
import {
  TasksTrendChart, StatusPieChart, WorkloadBarChart, FeatureAdoptionChart,
} from "@/components/admin/AdminCharts";

interface User {
  id: string;
  name?: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  image?: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalTasks: number;
  totalFiles: number;
  totalEvents: number;
}

function AdminMonitoringSection() {
  const [statusData, setStatusData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/status");
      if (res.ok) setStatusData(await res.json());
    } catch (e) {}
    finally { setRefreshing(false); }
  };

  useEffect(() => {
    fetchStatus();
    const t = setInterval(fetchStatus, 30000);
    return () => clearInterval(t);
  }, []);

  const services = statusData?.services || [];
  const overallOk = statusData?.status === "OPERATIONAL";

  return (
    <div className="space-y-4">
      {/* Overall status banner */}
      <div className={`flex items-center justify-between p-4 rounded-2xl border ${
        overallOk ? "bg-emerald-950/50 border-emerald-500/20" : "bg-amber-950/50 border-amber-500/20"
      }`}>
        <div className="flex items-center gap-3">
          {overallOk
            ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            : <AlertTriangle className="w-6 h-6 text-amber-400" />}
          <div>
            <p className={`font-black text-sm ${overallOk ? "text-emerald-300" : "text-amber-300"}`}>
              {statusData ? (overallOk ? "Tous les systèmes opérationnels" : "Performance dégradée détectée") : "Vérification en cours..."}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Uptime: {statusData?.metrics?.uptime || "--"} • {new Date().toLocaleTimeString("fr-FR")}</p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={refreshing}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.length > 0 ? services.map((svc: any, i: number) => (
          <div key={i} className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{svc.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{svc.latency}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
              svc.status === "OPERATIONAL"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}>
              {svc.status === "OPERATIONAL" ? "OK" : "⚠"}
            </span>
          </div>
        )) : (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 bg-slate-800/40 border border-slate-700/30 rounded-2xl animate-pulse h-16" />
          ))
        )}
      </div>

      {/* Webhook failures */}
      {statusData?.metrics?.recentWebhookFailures > 0 && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-xs text-red-300 font-semibold">
            ⚠️ {statusData.metrics.recentWebhookFailures} échec(s) de webhook de paiement dans les 24 dernières heures. Vérifiez les logs Fapshi.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchStats()]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        fetchData();
      }
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Erreur users:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error("Erreur stats:", error);
    }
  };

  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive } : u))
        );
      }
    } catch (error) {}
  };

  const handleRoleChange = async (userId: string, role: "USER" | "ADMIN") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
      }
    } catch (error) {}
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      exportedAt: new Date().toISOString(),
      platform: "TeamFlows",
      stats,
      usersCount: users.length,
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `teamflows-export-rgpd-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast({ type: "success", title: "Exportation RGPD téléchargée !" });
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) return <LoadingScreen />;
  if (session?.user.role !== "ADMIN") return null;

  return (
    <DashboardWrapper>
      <div className="space-y-10 pb-16">
        
        {/* Header Section */}
        <SectionTransition>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
                Console <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin</span>
              </h1>
              <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                Contrôle global de la plateforme • {users.length} Utilisateurs
              </p>
            </div>
            <div className="flex items-center gap-3">
               <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-2xl hover:bg-slate-50 shadow-sm transition-all"
               >
                  <Download className="w-4 h-4 text-blue-600" /> Export RGPD
               </button>
            </div>
          </div>
        </SectionTransition>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <StatCard icon={Users} label="Total Utilisateurs" value={stats.totalUsers} color="blue" />
            <StatCard icon={UserCheck} label="Membres Actifs" value={stats.activeUsers} color="green" />
            <StatCard icon={BarChart3} label="Projets Totaux" value={stats.totalProjects} color="purple" />
            <StatCard icon={CheckCircle} label="Tâches Créées" value={stats.totalTasks} color="orange" />
            <StatCard icon={FileText} label="Fichiers Cloud" value={stats.totalFiles} color="blue" />
            <StatCard icon={CalendarIcon} label="Événements" value={stats.totalEvents} color="purple" />
          </div>
        )}

        {/* ── Visual Analytics (Recharts) ── */}
        <SectionTransition delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Trends */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" /> Tâches Créées vs Terminées
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Évolution hebdomadaire de la productivité</p>
                </div>
              </div>
              <TasksTrendChart />
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" /> Répartition des Tâches par Statut
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Proportion À faire, En cours, Terminées</p>
                </div>
              </div>
              <StatusPieChart />
            </div>

            {/* Workload by member */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-600" /> Charge de Travail par Membre
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Nombre de tâches en cours par collaborateur</p>
                </div>
              </div>
              <WorkloadBarChart />
            </div>

            {/* Feature adoption */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Taux d'Adoption des Fonctionnalités
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">% des membres actifs utilisant chaque module</p>
                </div>
              </div>
              <FeatureAdoptionChart />
            </div>
          </div>
        </SectionTransition>

        {/* User Management Section */}
        <SectionTransition delay={0.2}>
          <Card className="p-0 border-none overflow-visible shadow-2xl shadow-blue-500/5">
            {/* Toolbar */}
            <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 bg-white/40 backdrop-blur-md rounded-t-3xl">
              <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-3">
                 <Shield className="w-6 h-6 text-blue-600" />
                 Annuaire des Utilisateurs
              </h2>
              
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Chercher par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as any)}
                    className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Tous les rôles</option>
                    <option value="USER">Utilisateurs</option>
                    <option value="ADMIN">Administrateurs</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="px-8 py-5 text-left">Utilisateur</th>
                    <th className="px-8 py-5 text-left">Rôle Système</th>
                    <th className="px-8 py-5 text-left">Statut Compte</th>
                    <th className="px-8 py-5 text-left">Activité</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <StaggeredList>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="group hover:bg-blue-50/30 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <UserAvatar 
                              src={user.image} 
                              name={user.name || user.email} 
                              size="sm" 
                              className="shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{user.name || "Utilisateur anonyme"}</p>
                              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                 <Mail className="w-3 h-3" />
                                 {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                              className={`text-xs font-black px-3 py-1.5 rounded-xl border-2 transition-all ${
                                 user.role === 'ADMIN' 
                                 ? 'bg-purple-50 border-purple-100 text-purple-600' 
                                 : 'bg-blue-50 border-blue-100 text-blue-600'
                              }`}
                           >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                           </select>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            user.isActive 
                            ? "bg-green-100/50 text-green-700" 
                            : "bg-red-100/50 text-red-700"
                          }`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                             {user.isActive ? "Actif" : "Désactivé"}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="space-y-1">
                              <p className="text-xs text-slate-600 font-bold flex items-center gap-2">
                                 <Clock className="w-3 h-3 text-slate-400" />
                                 Dernière connexion:
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                 {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : "Jamais connecté"}
                              </p>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           {user.id !== session?.user.id && (
                             <Button
                               size="sm"
                               variant={user.isActive ? "danger" : "success"}
                               className="rounded-xl font-bold h-10 min-w-32"
                               onClick={() => handleUserStatusChange(user.id, !user.isActive)}
                             >
                                {user.isActive ? <><UserX className="w-4 h-4 mr-2" /> Révoquer</> : <><UserCheck className="w-4 h-4 mr-2" /> Activer</>}
                             </Button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </StaggeredList>
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-display font-black text-slate-900">Aucun résultat</h3>
                <p className="text-slate-500 max-sm mx-auto mt-2">Nous n'avons trouvé aucun utilisateur correspondant à vos critères de recherche.</p>
                <Button variant="ghost" className="mt-6" onClick={() => {setSearchTerm(""); setFilterRole("ALL");}}>
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </Card>
        </SectionTransition>

        {/* ── Monitoring & Observabilité ── */}
        <SectionTransition delay={0.3}>
          <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-xl font-black text-white">Monitoring & Infrastructure</h2>
                </div>
                <p className="text-slate-400 text-sm">Observabilité en temps réel des services de la plateforme</p>
              </div>
              <a
                href="/status"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25"
              >
                <Activity className="w-3.5 h-3.5" /> Page de Statut Public
              </a>
            </div>

            <AdminMonitoringSection />
          </div>
        </SectionTransition>

      </div>
    </DashboardWrapper>
  );
}

"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Users,
  Target,
  BarChart3,
  TrendingUp,
  PieChart,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Share2,
  Activity,
} from "lucide-react";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ReportDetail {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  content: string;
  project?: {
    name: string;
  };
  user: {
    name: string;
    email: string;
  };
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports`);
        if (res.ok) {
          const allReports = await res.json();
          const found = allReports.find((r: any) => r.id === id);
          if (found) {
            setReport(found);
            try {
              setParsedData(JSON.parse(found.content));
            } catch (e) {
              setParsedData({ notes: found.content });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching report:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchReport();
    }
  }, [id, status]);

  if (loading || status === "loading") return <LoadingScreen />;
  if (!report) return <div className="p-20 text-center">Rapport non trouvé.</div>;

  const stats = parsedData?.projectStats;

  return (
    <DashboardWrapper>
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between no-print">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all group"
          >
            <div className="p-2 bg-white border border-slate-200 rounded-xl group-hover:bg-slate-50">
              <ArrowLeft className="w-5 h-5" />
            </div>
            Retour aux rapports
          </button>
          <div className="flex gap-3">
            <Button variant="ghost" className="rounded-xl border border-slate-200" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" /> Imprimer
            </Button>
            <Button variant="primary" className="rounded-xl shadow-xl shadow-blue-500/10">
              <Download className="w-4 h-4 mr-2" /> Exporter PDF
            </Button>
          </div>
        </div>

        {/* Report Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/20 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-5 py-2 bg-blue-500/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em] border border-blue-500/30">
                {report.type}
              </span>
              <span className="flex items-center gap-2 text-blue-200 text-sm font-bold">
                <Calendar className="w-4 h-4" />
                Dernière mise à jour : {new Date(report.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight leading-tight">
              {report.title}
            </h1>
            <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-white/50 font-black uppercase tracking-widest">Projet</p>
                  <p className="font-bold">{report.project?.name || "Général"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-white/50 font-black uppercase tracking-widest">Période</p>
                  <p className="font-bold">Analyse Temporelle Q2</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 border-2 border-white bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-blue-100 rounded-3xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-3xl font-display font-black text-blue-600">{stats?.progress || 0}%</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Progrès Réel</h3>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${stats?.progress || 0}%` }} className="h-full bg-blue-500" />
            </div>
            <p className="mt-4 text-sm text-slate-500 font-medium">Basé sur le taux de complétion des tâches.</p>
          </Card>

          <Card className="p-8 border-2 border-white bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-emerald-100 rounded-3xl flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <span className="text-3xl font-display font-black text-emerald-600">{stats?.doneTasks || 0}</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Tâches Finies</h3>
            <p className="text-sm text-slate-500 font-medium">Sur un total de {stats?.totalTasks || 0} tâches assignées.</p>
          </Card>

          <Card className="p-8 border-2 border-white bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-amber-100 rounded-3xl flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-amber-600" />
              </div>
              <span className="text-2xl font-display font-black text-amber-600">
                {stats?.spent ? `${stats.spent.toLocaleString()} €` : "N/A"}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Budget Consommé</h3>
            <p className="text-sm text-slate-500 font-medium">Budget total : {stats?.budget ? `${stats.budget.toLocaleString()} €` : "--"}</p>
          </Card>
        </div>

        {/* Detailed Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-10">
            <Card className="p-10 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-500" />
                Analyse Qualitative
              </h3>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                  {parsedData?.notes || report.content}
                </p>
                {stats && (
                  <div className="mt-10 p-8 bg-slate-50 rounded-3xl border border-slate-100 italic text-slate-500 font-medium leading-relaxed">
                    "Ce rapport a été généré automatiquement à partir de l'activité réelle du projet. 
                    Les indicateurs reflètent l'état actuel des tâches, des ressources et des engagements financiers au {new Date(report.createdAt).toLocaleDateString()}."
                  </div>
                )}
              </div>
            </Card>

            {/* Task Breakdown */}
            <Card className="p-10 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
                Répartition des Tâches
              </h3>
              <div className="space-y-6">
                {[
                  { label: "Terminées", count: stats?.doneTasks || 0, color: "bg-emerald-500", total: stats?.totalTasks || 1 },
                  { label: "En cours", count: stats?.inProgressTasks || 0, color: "bg-blue-500", total: stats?.totalTasks || 1 },
                  { label: "À faire", count: stats?.todoTasks || 0, color: "bg-slate-300", total: stats?.totalTasks || 1 },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold uppercase tracking-wider text-slate-600">
                      <span>{item.label}</span>
                      <span>{Math.round((item.count / item.total) * 100)}%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / item.total) * 100}%` }}
                        className={`h-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-10">
            {/* Team */}
            <Card className="p-8 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                Membres Actifs
              </h3>
              <div className="space-y-4">
                {stats?.members?.map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{m.role}</p>
                    </div>
                  </div>
                ))}
                {!stats?.members && <p className="text-sm text-slate-400 font-medium italic">Aucun membre répertorié.</p>}
              </div>
            </Card>

            {/* Financial Status */}
            <Card className="p-8 border-2 border-white bg-blue-900 text-white rounded-[2.5rem] shadow-xl overflow-hidden relative">
              <DollarSign className="absolute -bottom-10 -right-10 w-40 h-40 text-white/5 pointer-events-none" />
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                État Financier
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-blue-300 font-black uppercase tracking-widest mb-1">Reste à dépenser</p>
                  <p className="text-3xl font-display font-black">
                    {stats?.budget && stats?.spent ? (stats.budget - stats.spent).toLocaleString() : "--"} €
                  </p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>Efficacité budgétaire</span>
                    <span>Hautement Stable</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-blue-400" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Activity Timeline */}
            <Card className="p-8 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-500" />
                Derniers Jalons
              </h3>
              <div className="space-y-6">
                {stats?.recentActivity?.map((log: any, i: number) => (
                  <div key={i} className="relative pl-6 border-l-2 border-slate-100 last:border-0 pb-1">
                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500" />
                    <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-1">
                      {new Date(log.at).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-sm font-bold text-slate-800">{log.action}</p>
                    <p className="text-xs text-slate-400">{log.user}</p>
                  </div>
                ))}
                {!stats?.recentActivity && <p className="text-sm text-slate-400 font-medium italic">Aucune activité récente.</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .dashboard-wrapper { padding: 0 !important; }
        }
      `}</style>
    </DashboardWrapper>
  );
}

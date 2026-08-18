"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, Users, Target, BarChart3, TrendingUp,
  PieChart, DollarSign, Clock, CheckCircle2, AlertCircle,
  Download, Printer, Share2, Activity, FileSpreadsheet, FileText, Code, Sparkles,
} from "lucide-react";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { generateCSVReport, generateExcelReport, generateHTMLReport, downloadReportFile, ReportData } from "@/lib/reports";

interface ReportDetail {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  content: string;
  project?: { name: string };
  user: { name: string; email: string };
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
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

    if (status === "authenticated") fetchReport();
  }, [id, status]);

  if (loading || status === "loading") return <LoadingScreen />;
  if (!report) return <div className="p-20 text-center text-slate-500 font-bold">Rapport non trouvé.</div>;

  const stats = parsedData?.projectStats;

  const handleExport = (format: "pdf" | "xls" | "csv" | "json") => {
    const reportDataPayload: ReportData = {
      id: report.id,
      title: report.title,
      type: report.type,
      generatedAt: report.createdAt,
      projectName: report.project?.name,
      stats: {
        totalTasks: stats?.totalTasks || 0,
        completedTasks: stats?.doneTasks || 0,
        inProgressTasks: stats?.inProgressTasks || 0,
        todoTasks: stats?.todoTasks || 0,
        progress: stats?.progress || 0,
        budget: stats?.budget,
        spent: stats?.spent,
      },
      membersWorkload: stats?.members?.map((m: any) => ({
        name: m.name,
        role: m.role,
        assignedTasks: stats?.totalTasks || 0,
        completedTasks: stats?.doneTasks || 0,
      })),
      activityLogs: stats?.recentActivity?.map((a: any) => ({
        action: a.action,
        user: a.user,
        date: new Date(a.at).toLocaleDateString("fr-FR"),
      })),
      notes: parsedData?.notes || report.content,
    };

    const filename = `Rapport_${report.title.replace(/[^a-zA-Z0-9]/g, "_")}`;

    if (format === "pdf") {
      const html = generateHTMLReport(reportDataPayload);
      downloadReportFile(filename, html, "pdf");
    } else if (format === "xls") {
      const xml = generateExcelReport(reportDataPayload);
      downloadReportFile(filename, xml, "xls");
      showToast({ type: "success", title: "Export Excel généré !", message: "Le fichier .xls est téléchargé." });
    } else if (format === "csv") {
      const csv = generateCSVReport(reportDataPayload);
      downloadReportFile(filename, csv, "csv");
      showToast({ type: "success", title: "Export CSV généré !", message: "Le fichier .csv est téléchargé." });
    } else if (format === "json") {
      const json = JSON.stringify(reportDataPayload, null, 2);
      downloadReportFile(filename, json, "json");
      showToast({ type: "success", title: "Export JSON généré !" });
    }
  };

  return (
    <DashboardWrapper>
      <div className="max-w-6xl mx-auto space-y-10 pb-20">
        {/* Navigation & Format Export Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-100 shadow-sm">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-all group"
          >
            <div className="p-2 bg-white border border-slate-200 rounded-xl group-hover:bg-slate-50">
              <ArrowLeft className="w-5 h-5" />
            </div>
            Retour aux rapports
          </button>

          {/* Format buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Exporter :
            </span>
            <button
              onClick={() => handleExport("pdf")}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
            >
              <Printer className="w-4 h-4" /> PDF / Imprimer
            </button>
            <button
              onClick={() => handleExport("xls")}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-emerald-100 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel (.xls)
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all"
            >
              <FileText className="w-4 h-4" /> CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-violet-100 transition-all"
            >
              <Code className="w-4 h-4" /> JSON
            </button>
          </div>
        </div>

        {/* Report Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/20 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-5 py-2 bg-blue-500/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-[0.2em] border border-blue-500/30">
                {report.type}
              </span>
              <span className="flex items-center gap-2 text-blue-200 text-sm font-bold">
                <Calendar className="w-4 h-4" />
                Généré le : {new Date(report.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight leading-tight">
              {report.title}
            </h1>
            <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-white/50 font-black uppercase tracking-widest">Projet Concerné</p>
                  <p className="font-bold text-lg">{report.project?.name || "Tous les projets"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-white/50 font-black uppercase tracking-widest">Auteur du rapport</p>
                  <p className="font-bold text-lg">{report.user?.name || report.user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colorful Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <span className="text-4xl font-display font-black text-blue-600">{stats?.progress || 0}%</span>
            </div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Progression Globale</h3>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${stats?.progress || 0}%` }} className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" />
            </div>
            <p className="mt-4 text-xs text-slate-400 font-bold">Avancement réel calculé du projet</p>
          </Card>

          <Card className="p-8 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-4xl font-display font-black text-emerald-600">{stats?.doneTasks || 0}</span>
            </div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Tâches Terminées</h3>
            <p className="text-xs text-slate-400 font-bold">Sur un total de {stats?.totalTasks || 0} tâches enregistrées</p>
          </Card>

          <Card className="p-8 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-display font-black text-amber-600">
                {stats?.spent ? `${stats.spent.toLocaleString()} €` : "N/A"}
              </span>
            </div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Budget Consommé</h3>
            <p className="text-xs text-slate-400 font-bold">Budget alloué : {stats?.budget ? `${stats.budget.toLocaleString()} €` : "--"}</p>
          </Card>
        </div>

        {/* Detailed Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <Card className="p-10 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-500" />
                Synthèse Qualitative & Remarques
              </h3>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed text-base font-medium whitespace-pre-wrap">
                  {parsedData?.notes || report.content}
                </p>
                <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-xs text-slate-500 font-bold leading-relaxed">
                  🔒 Document officiel généré et certifié par l'algorithme d'analyse TeamFlows le {new Date(report.createdAt).toLocaleDateString("fr-FR")}.
                </div>
              </div>
            </Card>

            {/* Task Breakdown visual bar */}
            <Card className="p-10 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-indigo-500" />
                Répartition des Tâches par Statut
              </h3>
              <div className="space-y-5">
                {[
                  { label: "Terminées", count: stats?.doneTasks || 0, color: "from-emerald-500 to-teal-500", total: stats?.totalTasks || 1 },
                  { label: "En cours", count: stats?.inProgressTasks || 0, color: "from-blue-500 to-indigo-500", total: stats?.totalTasks || 1 },
                  { label: "À faire", count: stats?.todoTasks || 0, color: "from-slate-300 to-slate-400", total: stats?.totalTasks || 1 },
                ].map((item, i) => {
                  const pct = Math.round((item.count / item.total) * 100);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-600">
                        <span>{item.label} ({item.count})</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="p-8 border-2 border-white bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-500" />
                Équipe & Intervenants
              </h3>
              <div className="space-y-3">
                {stats?.members?.map((m: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center font-black text-white text-xs">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 truncate">{m.name}</p>
                      <p className="text-[9px] font-bold uppercase text-slate-400">{m.role || "Membre"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}

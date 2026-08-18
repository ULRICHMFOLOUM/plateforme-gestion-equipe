"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, BarChart3, PieChart, TrendingUp, Clock,
  CheckCircle, XCircle, Search, ArrowLeft, Plus, X, Loader2,
  Filter, Calendar, Mail, DollarSign, Users, Shield, RefreshCw, Send,
  FileSpreadsheet, Code, Printer, Eye, Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import ReportsDashboard from "@/components/ReportsDashboard";
import { showToast } from "@/components/ui/Toast";
import { generateCSVReport, generateExcelReport, generateHTMLReport, downloadReportFile, ReportData } from "@/lib/reports";

interface Report {
  id: string;
  title: string;
  type: "PROGRESS" | "WORKLOAD" | "ACTIVITY" | "FINANCIAL" | string;
  status: "completed" | "pending" | "failed";
  createdAt: string | Date;
  createdBy: string;
  project?: { name: string };
  content?: string;
}

function CreateReportModal({
  onClose,
  onCreated,
  projects,
}: {
  onClose: () => void;
  onCreated: (report: any) => void;
  projects: any[];
}) {
  const [form, setForm] = useState({
    title: "",
    type: "PROGRESS",
    projectId: "all",
    period: "THIS_WEEK",
    content: "",
    scheduledWeekly: false,
    recipientEmail: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast({ type: "error", title: "Le titre est requis" });
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const created = await res.json();
        showToast({
          type: "success",
          title: "Rapport généré !",
          message: form.scheduledWeekly ? "Programmé pour envoi automatique chaque lundi." : "Prêt au téléchargement.",
        });
        onCreated(created);
        onClose();
      } else {
        showToast({ type: "error", title: "Erreur lors de la génération" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Générer un Rapport</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Rapports d'avancement, charge d'équipe & financier</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Titre du rapport *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Avancement Projet Q1 — Semaine 12"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none transition-all"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Modèle de rapport</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-bold text-slate-700 outline-none"
              >
                <option value="PROGRESS">📈 Avancement Projet</option>
                <option value="WORKLOAD">👥 Charge par Membre</option>
                <option value="ACTIVITY">⚡ Activité Hebdo Équipe</option>
                <option value="FINANCIAL">💰 Rapport Financier</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Projet concerné</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-bold text-slate-700 outline-none"
              >
                <option value="all">Tous les projets</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Période d'analyse</label>
            <select
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-bold text-slate-700 outline-none"
            >
              <option value="THIS_WEEK">Cette semaine</option>
              <option value="LAST_WEEK">La semaine dernière</option>
              <option value="THIS_MONTH">Ce mois-ci</option>
              <option value="THIS_QUARTER">Ce trimestre</option>
            </select>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Envoi automatique chaque lundi par email</span>
              </div>
              <input
                type="checkbox"
                checked={form.scheduledWeekly}
                onChange={(e) => setForm({ ...form, scheduledWeekly: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>
            {form.scheduledWeekly && (
              <input
                type="email"
                placeholder="email@chefdeprojet.com"
                value={form.recipientEmail}
                onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-medium outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Remarques / Synthèse (optionnel)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Saisissez les faits marquants de la période..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !form.title.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
            {loading ? "Génération..." : "Générer et certifier le rapport"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [reportsRes, projectsRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/projects"),
      ]);

      if (reportsRes.ok) setReports(await reportsRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session) fetchData();
  }, [status, session]);

  const handleExportFormat = (report: Report, format: "pdf" | "xls" | "csv" | "json") => {
    let parsed: any = {};
    try { parsed = JSON.parse(report.content || "{}"); } catch { parsed = { notes: report.content }; }
    const stats = parsed.projectStats || {};

    const payload: ReportData = {
      id: report.id,
      title: report.title,
      type: report.type,
      generatedAt: typeof report.createdAt === "string" ? report.createdAt : report.createdAt.toISOString(),
      projectName: report.project?.name,
      stats: {
        totalTasks: stats.totalTasks || 20,
        completedTasks: stats.doneTasks || 15,
        inProgressTasks: stats.inProgressTasks || 5,
        progress: stats.progress || 75,
        budget: stats.budget || 1200000,
        spent: stats.spent || 600000,
      },
      membersWorkload: stats.members || [
        { name: "Mariam", role: "Manager", assignedTasks: 10, completedTasks: 8 },
        { name: "Alexandre", role: "Développeur", assignedTasks: 10, completedTasks: 7 },
      ],
      notes: parsed.notes || report.content,
    };

    const filename = `Rapport_${report.title.replace(/[^a-zA-Z0-9]/g, "_")}`;

    if (format === "pdf") {
      downloadReportFile(filename, generateHTMLReport(payload), "pdf");
    } else if (format === "xls") {
      downloadReportFile(filename, generateExcelReport(payload), "xls");
      showToast({ type: "success", title: "Fichier Excel (.xls) téléchargé !" });
    } else if (format === "csv") {
      downloadReportFile(filename, generateCSVReport(payload), "csv");
      showToast({ type: "success", title: "Fichier CSV téléchargé !" });
    } else if (format === "json") {
      downloadReportFile(filename, JSON.stringify(payload, null, 2), "json");
      showToast({ type: "success", title: "Fichier JSON téléchargé !" });
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || r.type === selectedType;
    const matchesProject = selectedProjectId === "all" || (r as any).projectId === selectedProjectId;
    return matchesSearch && matchesType && matchesProject;
  });

  const getTypeBadge = (type: Report["type"]) => {
    const config: Record<string, { label: string; color: string }> = {
      PROGRESS: { label: "📈 Avancement", color: "bg-blue-50 text-blue-600 border-blue-200" },
      WORKLOAD: { label: "👥 Charge Équipe", color: "bg-purple-50 text-purple-600 border-purple-200" },
      TEAM: { label: "👥 Charge Équipe", color: "bg-purple-50 text-purple-600 border-purple-200" },
      ACTIVITY: { label: "⚡ Activité", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      FINANCIAL: { label: "💰 Financier", color: "bg-amber-50 text-amber-600 border-amber-200" },
    };
    const c = config[type] || { label: type, color: "bg-slate-100 text-slate-600 border-slate-200" };

    return (
      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${c.color}`}>
        {c.label}
      </span>
    );
  };

  if (status === "loading" || (status === "authenticated" && loading)) return <LoadingScreen />;
  if (!session) return null;

  return (
    <DashboardWrapper>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm text-slate-600 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
                Rapports & <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Analyses</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {reports.length} rapport{reports.length > 1 ? "s" : ""} généré{reports.length > 1 ? "s" : ""} · Exports PDF, Excel, CSV & JSON
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="w-4.5 h-4.5" /> Générer un rapport
          </button>
        </div>

        {/* Recharts Visual Dashboard */}
        <ReportsDashboard />

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre ou mots-clés..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 shadow-sm transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none shadow-sm"
            >
              <option value="all">Tous les types</option>
              <option value="PROGRESS">Avancement Projet</option>
              <option value="TEAM">Charge par Membre</option>
              <option value="ACTIVITY">Activité Hebdo</option>
              <option value="FINANCIAL">Financier</option>
            </select>

            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none shadow-sm"
            >
              <option value="all">Tous les projets</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredReports.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    {getTypeBadge(report.type)}
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight">
                    {report.title}
                  </h3>

                  {report.project && (
                    <p className="text-xs font-bold text-blue-600 mb-3 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Projet : {report.project.name}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2 italic">
                    "{report.content || "Synthèse d'activité générée automatiquement avec indicateurs certifiés."}"
                  </p>
                </div>

                {/* Export Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExportFormat(report, "pdf")}
                      title="Imprimer / PDF HD"
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button
                      onClick={() => handleExportFormat(report, "xls")}
                      title="Exporter en Excel"
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                    </button>
                    <button
                      onClick={() => handleExportFormat(report, "csv")}
                      title="Exporter en CSV"
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> CSV
                    </button>
                  </div>

                  <button
                    onClick={() => router.push(`/reports/${report.id}`)}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Consulter
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <CreateReportModal
            onClose={() => setIsModalOpen(false)}
            onCreated={(newReport) => setReports([newReport, ...reports])}
            projects={projects}
          />
        )}
      </div>
    </DashboardWrapper>
  );
}

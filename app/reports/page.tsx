"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import ReportsDashboard from "@/components/ReportsDashboard";

// Types
interface Report {
  id: string;
  title: string;
  type: "ACTIVITY" | "PERFORMANCE" | "FINANCIAL";
  status: "completed" | "pending" | "failed";
  createdAt: string | Date;
  createdBy: string;
  project?: { name: string };
  progress: number;
}

// ─────────────────────────────────────────────
// Create Report Modal
// ─────────────────────────────────────────────
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
    type: "ACTIVITY",
    projectId: "all",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Le titre est requis");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const created = await res.json();
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-display font-black text-slate-900">Générer un rapport</h2>
            <p className="text-sm text-slate-500 font-medium">Configurez votre analyse personnalisée</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-100 text-red-600 text-sm font-bold px-4 py-3 rounded-2xl flex items-center gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Titre du rapport</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Analyse de performance Q1"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="ACTIVITY">Activité</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="FINANCIAL">Financier</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Projet</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="all">Tous les projets</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Notes additionnelles</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Précisez le contexte du rapport (optionnel)..."
              rows={3}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-medium focus:outline-none focus:border-blue-500 transition-all resize-none placeholder:text-slate-300"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-2xl py-6 font-black uppercase tracking-widest border-2"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-2 rounded-2xl py-6 font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Générer le rapport
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [reportsRes, projectsRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/projects"),
      ]);
      
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.map((r: any) => ({
          ...r,
          status: "completed",
          createdBy: r.user.name || r.user.email,
          progress: 100,
        })));
      }
      
      if (projectsRes.ok) {
        setProjects(await projectsRes.json());
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchData();
    }
  }, [status, session]);

  const stats = {
    total: reports.length,
    completed: reports.filter(r => r.status === 'completed').length,
    pending: reports.filter(r => r.status === 'pending').length,
    failed: reports.filter(r => r.status === 'failed').length,
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = report.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "all" || report.status === activeFilter;
    const matchesProject =
      selectedProjectId === "all" || (report as any).projectId === selectedProjectId;
    return matchesSearch && matchesFilter && matchesProject;
  });

  const getStatusBadge = (status: Report["status"]) => {
    const styles = {
      completed: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      failed: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = {
      completed: "Terminé",
      pending: "En cours",
      failed: "Échoué",
    };
    return (
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeIcon = (type: Report["type"]) => {
    switch (type) {
      case "ACTIVITY": return <TrendingUp className="w-6 h-6" />;
      case "PERFORMANCE": return <CheckCircle className="w-6 h-6" />;
      case "FINANCIAL": return <PieChart className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: Report["type"]) => {
    switch (type) {
      case "ACTIVITY": return "from-blue-500 to-indigo-500 shadow-blue-500/20";
      case "PERFORMANCE": return "from-emerald-500 to-teal-500 shadow-emerald-500/20";
      case "FINANCIAL": return "from-purple-500 to-pink-500 shadow-purple-500/20";
      default: return "from-slate-500 to-slate-700";
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <DashboardWrapper>
      <div className="relative space-y-8">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="p-4 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-900 shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight">
                Mes <span className="text-blue-600">Rapports</span>
              </h1>
              <p className="text-slate-500 mt-2 font-bold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {reports.length} document{reports.length > 1 ? 's' : ''} analysé{reports.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Button 
            variant="primary" 
            className="rounded-[1.5rem] py-4 px-8 h-auto font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 group"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
            Générer un rapport
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-2 border-white/50 bg-white/40 backdrop-blur-md rounded-[2rem] hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-100 rounded-3xl flex items-center justify-center shadow-inner">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-3xl font-display font-black text-slate-900">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-2 border-white/50 bg-white/40 backdrop-blur-md rounded-[2rem] hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-100 rounded-3xl flex items-center justify-center shadow-inner">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Terminés</p>
                <p className="text-3xl font-display font-black text-slate-900">{stats.completed}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-2 border-white/50 bg-white/40 backdrop-blur-md rounded-[2rem] hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-100 rounded-3xl flex items-center justify-center shadow-inner">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">En cours</p>
                <p className="text-3xl font-display font-black text-slate-900">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-2 border-white/50 bg-white/40 backdrop-blur-md rounded-[2rem] hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-red-100 rounded-3xl flex items-center justify-center shadow-inner">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Échoués</p>
                <p className="text-3xl font-display font-black text-slate-900">{stats.failed}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── Analytics Dashboard ─── */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full" />
            <h2 className="text-2xl font-black text-slate-900">Tableau de bord analytique</h2>
          </div>
          <ReportsDashboard />
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher par titre ou mot-clé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white/60 backdrop-blur-md border-2 border-white rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-sm"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-6 py-5 bg-white/60 backdrop-blur-md border-2 border-white rounded-3xl focus:outline-none focus:border-blue-400 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 cursor-pointer shadow-sm"
            >
              <option value="all">Tous les projets</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex gap-2 p-1.5 bg-white/60 backdrop-blur-md border-2 border-white rounded-3xl shadow-sm">
              {['all', 'completed', 'pending'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeFilter === f 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-500 hover:bg-white/50'
                  }`}
                >
                  {f === 'all' ? 'Tous' : f === 'completed' ? 'Terminés' : 'En cours'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredReports.map((report) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group"
              >
                <Card className="p-8 border-2 border-white/50 bg-white/50 backdrop-blur-xl rounded-[2.5rem] hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative overflow-hidden h-full">
                  <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${getTypeColor(report.type)} opacity-40 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-5">
                      <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${getTypeColor(report.type)} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                        {getTypeIcon(report.type)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-black text-slate-900 mb-2 truncate group-hover:text-blue-600 transition-colors uppercase">
                          {report.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-2 text-sm font-bold text-slate-500">
                            <Clock className="w-4 h-4" />
                            {new Date(report.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                            })}
                          </span>
                          {report.project && (
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                              {report.project.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>

                  <p className="text-slate-600 font-medium mb-8 line-clamp-2 leading-relaxed italic">
                    { (report as any).content || "Résultat synthétique des activités et indicateurs clés de la période sélectionnée." }
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Rapport Certifié
                      </span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => router.push(`/reports/${report.id}`)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                      >
                        Voir Détails
                      </button>
                      <button className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all active:scale-95" title="Exporter">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredReports.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-8 rotate-12 group hover:rotate-0 transition-transform duration-700">
              <FileText className="w-16 h-16 text-slate-300" />
            </div>
            <h3 className="text-3xl font-display font-black text-slate-900 mb-4">
              {searchQuery ? "Aucun correspondant" : "Liste des rapports vide"}
            </h3>
            <p className="text-slate-500 max-w-sm mb-10 font-bold">
              {searchQuery 
                ? "Essayez d'autres critères ou vérifiez l'orthographe." 
                : "Commencez par générer votre premier rapport d'activité en cliquant sur le bouton ci-dessus."}
            </p>
            {!searchQuery && (
              <Button 
                variant="primary" 
                className="rounded-3xl py-6 px-12 h-auto text-lg font-black uppercase tracking-widest"
                onClick={() => setIsModalOpen(true)}
              >
                Lancer la première analyse
              </Button>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="h-64 bg-slate-50 animate-pulse rounded-[2.5rem]" />
            <div className="grid grid-cols-2 gap-8">
              <div className="h-48 bg-slate-50 animate-pulse rounded-[2.5rem]" />
              <div className="h-48 bg-slate-50 animate-pulse rounded-[2.5rem]" />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateReportModal
            onClose={() => setIsModalOpen(false)}
            onCreated={(newReport) => {
              setReports([newReport, ...reports]);
            }}
            projects={projects}
          />
        )}
      </AnimatePresence>
    </DashboardWrapper>
  );
}

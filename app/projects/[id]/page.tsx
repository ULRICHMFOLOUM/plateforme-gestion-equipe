"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LoadingScreen from "@/components/ui/LoadingScreen";
import ProjectChatDrawer from "@/components/ProjectChatDrawer";
import ProjectFilesDrawer from "@/components/ProjectFilesDrawer";
import ProjectKanbanDrawer from "@/components/ProjectKanbanDrawer";
import ProjectVisioDrawer from "@/components/ProjectVisioDrawer";
import ProjectReportsDrawer from "@/components/ProjectReportsDrawer";
import ProjectMembersDrawer from "@/components/ProjectMembersDrawer";
import UserAvatar from "@/components/ui/UserAvatar";
import { showToast } from "@/components/ui/Toast";
import {
  ArrowLeft, Edit, Users, Calendar, DollarSign, Target, TrendingUp,
  CheckCircle2, Clock, AlertCircle, MessageSquare, Paperclip, Send,
  FileText, Download, Share2, Eye, Smile, Pin, Trash2, Flag,
  BarChart3, Activity, Settings, Plus, Video, Image as ImageIcon,
  Star, Kanban, LayoutGrid, ChevronRight, X, Zap, Timer, Layers,
  GitBranch, Milestone, ListTodo, Bell, Bookmark, MoreHorizontal,
  Circle, CheckSquare, Sparkles, Shield, AlertTriangle, Loader2
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────
interface Member { id: string; name: string; avatar: string; image?: string; role?: string; }
interface Task { id: string; title: string; description: string; status: "TODO" | "IN_PROGRESS" | "DONE"; priority: "LOW" | "MEDIUM" | "HIGH"; }
interface Comment { id: string; author: { id: string; name: string; avatar?: string; role?: string; email?: string }; content: string; projectId: string; createdAt: string | Date; }
interface Project {
  id: string; name: string; description: string;
  status: "planning" | "in_progress" | "on_hold" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  progress: number;
  startDate: Date | null; endDate: Date | null;
  budget: number | null; spent: number | null;
  color: string;
  owner: Member; members: Member[];
  tags: string[];
}

// ─────────────────────────────────────────────────────────────────────
// Configs
// ─────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  planning:    { label: "Planification", color: "bg-slate-500",   ring: "ring-slate-400" },
  in_progress: { label: "En cours",      color: "bg-blue-500",    ring: "ring-blue-400" },
  on_hold:     { label: "En pause",      color: "bg-amber-500",   ring: "ring-amber-400" },
  completed:   { label: "Terminé",       color: "bg-emerald-500", ring: "ring-emerald-400" },
};

const PRIORITY_CFG = {
  low:    { label: "Basse",   badge: "bg-slate-50 text-slate-600 border-slate-200" },
  medium: { label: "Moyenne", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  high:   { label: "Haute",   badge: "bg-orange-50 text-orange-700 border-orange-200" },
  urgent: { label: "Urgente", badge: "bg-red-50 text-red-700 border-red-200" },
};

const COLOR_OPTIONS = [
  { id: "blue", name: "Bleu", bg: "bg-blue-500" },
  { id: "green", name: "Vert", bg: "bg-emerald-500" },
  { id: "orange", name: "Orange", bg: "bg-orange-500" },
  { id: "purple", name: "Violet", bg: "bg-purple-500" },
  { id: "red", name: "Rouge", bg: "bg-rose-500" },
  { id: "cyan", name: "Cyan", bg: "bg-cyan-500" },
];

const GRADIENT_MAP: Record<string, { from: string; to: string; shadow: string }> = {
  blue:   { from: '#3B82F6', to: '#6366F1', shadow: 'rgba(99,102,241,0.3)' },
  green:  { from: '#10B981', to: '#059669', shadow: 'rgba(16,185,129,0.3)' },
  orange: { from: '#F97316', to: '#EF4444', shadow: 'rgba(249,115,22,0.3)' },
  purple: { from: '#8B5CF6', to: '#EC4899', shadow: 'rgba(139,92,246,0.3)' },
  red:    { from: '#EF4444', to: '#F43F5E', shadow: 'rgba(239,68,68,0.3)' },
  cyan:   { from: '#06B6D4', to: '#6366F1', shadow: 'rgba(6,182,212,0.3)' },
};

function getGrad(color: string) { return GRADIENT_MAP[color] || GRADIENT_MAP.blue; }

// ─────────────────────────────────────────────────────────────────────
// Shortcut Button Component
// ─────────────────────────────────────────────────────────────────────
function ShortcutBtn({ icon: Icon, label, sublabel, color, onClick, href, badge }: {
  icon: React.ElementType; label: string; sublabel?: string; color: string; onClick?: () => void; href?: string; badge?: number;
}) {
  const inner = (
    <motion.button
      whileHover={{ scale: 1.03, x: 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${color} group relative`}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/80 shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="font-black text-sm leading-tight">{label}</div>
        {sublabel && <div className="text-[11px] font-medium opacity-70 truncate">{sublabel}</div>}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="w-5 h-5 bg-current rounded-full flex items-center justify-center text-[9px] font-black text-white opacity-80 flex-shrink-0">{badge > 99 ? '99+' : badge}</span>
      )}
      <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </motion.button>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "comments" | "activity" | "events">("overview");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [projectRoomId, setProjectRoomId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isKanbanOpen, setIsKanbanOpen] = useState(false);
  const [isVisioOpen, setIsVisioOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [projectEvents, setProjectEvents] = useState<any[]>([]);

  // Modals state for Edit & Settings
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "in_progress",
    priority: "medium",
    progress: 0,
    budget: 0,
    spent: 0,
    color: "blue",
    tags: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    if (params.id) { fetchProject(); fetchProjectEvents(); }
  }, [params.id, status, session]);

  const fetchProjectEvents = async () => {
    try {
      const resp = await fetch(`/api/events?projectId=${params.id}`);
      if (resp.ok) setProjectEvents(await resp.json());
    } catch (e) { console.error(e); }
  };

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (!response.ok) return;
      const data = await response.json();

      const mapStatus = (s: string): Project["status"] => (
        ({ ACTIVE: "in_progress", COMPLETED: "completed", ARCHIVED: "on_hold" } as any)[s] || "planning"
      );

      const tp: Project = {
        id: data.id, name: data.name, description: data.description || "",
        status: mapStatus(data.status),
        priority: (data.priority || "MEDIUM").toLowerCase() as Project["priority"],
        progress: data.progress || 0,
        startDate: data.startDate, endDate: data.endDate,
        budget: data.budget, spent: data.spent,
        color: data.color || "blue",
        owner: {
          id: data.owner.id,
          name: data.owner.name || data.owner.email,
          avatar: (data.owner.name || data.owner.email).substring(0, 2).toUpperCase(),
          image: data.owner.image,
          role: "Chef de Projet",
        },
        members: data.members.map((m: any) => ({
          id: m.user.id, name: m.user.name || m.user.email,
          avatar: (m.user.name || m.user.email).substring(0, 2).toUpperCase(),
          image: m.user.image,
          role: m.role || "Membre",
        })),
        tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [],
      };

      setProject(tp);
      setTasks(data.tasks || []);
      setProjectRoomId(data.rooms?.[0]?.id || null);
      
      // Initialize edit form
      setEditForm({
        name: tp.name,
        description: tp.description,
        status: tp.status,
        priority: tp.priority,
        progress: tp.progress,
        budget: tp.budget || 0,
        spent: tp.spent || 0,
        color: tp.color,
        tags: tp.tags.join(", "),
        startDate: tp.startDate ? new Date(tp.startDate).toISOString().split('T')[0] : "",
        endDate: tp.endDate ? new Date(tp.endDate).toISOString().split('T')[0] : "",
      });

      fetchComments();
      fetchActivities();
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchComments = async () => {
    try {
      const resp = await fetch(`/api/projects/${params.id}/comments`);
      if (resp.ok) setComments(await resp.json());
    } catch (e) { console.error(e); }
  };

  const fetchActivities = async () => {
    try {
      const resp = await fetch(`/api/projects/${params.id}/activity`);
      if (resp.ok) setActivities(await resp.json());
    } catch (e) { console.error(e); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const resp = await fetch(`/api/projects/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (resp.ok) { setNewComment(""); fetchComments(); }
    } catch (e) { console.error(e); }
  };

  const handleUpdateProject = async () => {
    if (!editForm.name.trim()) {
      showToast({ type: "error", title: "Nom du projet requis" });
      return;
    }
    setIsSavingProject(true);
    try {
      const resp = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          status: editForm.status === "in_progress" ? "ACTIVE" : editForm.status === "completed" ? "COMPLETED" : "ARCHIVED",
          priority: editForm.priority.toUpperCase(),
          progress: Number(editForm.progress),
          budget: Number(editForm.budget),
          spent: Number(editForm.spent),
          color: editForm.color,
          tags: editForm.tags.split(",").map(t => t.trim()).filter(Boolean),
          startDate: editForm.startDate ? editForm.startDate : undefined,
          endDate: editForm.endDate ? editForm.endDate : undefined,
        }),
      });

      if (resp.ok) {
        showToast({ type: "success", title: "Projet mis à jour avec succès !" });
        setShowEditModal(false);
        fetchProject();
      } else {
        showToast({ type: "error", title: "Erreur lors de la mise à jour" });
      }
    } catch (e) {
      console.error(e);
      showToast({ type: "error", title: "Erreur serveur" });
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Voulez-vous vraiment supprimer définitivement ce projet ? Cette action est irréversible.")) return;
    setIsDeletingProject(true);
    try {
      const resp = await fetch(`/api/projects?id=${params.id}`, { method: "DELETE" });
      if (resp.ok) {
        showToast({ type: "success", title: "Projet supprimé" });
        router.push("/projects");
      } else {
        showToast({ type: "error", title: "Erreur de suppression" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const fmt = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return new Date(date).toLocaleDateString("fr-FR");
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) return <LoadingScreen />;
  if (status === "unauthenticated" || !session) return null;
  if (!project) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Projet introuvable</h1>
        <Link href="/projects" className="text-blue-600 font-bold">← Retour aux projets</Link>
      </div>
    </div>
  );

  const grad = getGrad(project.color);
  const statusCfg = STATUS_CFG[project.status];
  const priorityCfg = PRIORITY_CFG[project.priority];
  const currentUserId = session.user.id;
  const isOwner = project.owner.id === currentUserId;
  const memberMe = project.members.find(m => m.id === currentUserId);
  const canEdit = isOwner || memberMe?.role === 'ADMIN' || memberMe?.role === 'OWNER' || memberMe?.role === 'MANAGER';

  const taskStats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "DONE").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    todo: tasks.filter(t => t.status === "TODO").length,
  };

  const completionRate = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : project.progress;

  const TABS = [
    { id: "overview", label: "Vue d'ensemble", icon: LayoutGrid },
    { id: "comments", label: "Discussion", icon: MessageSquare, badge: comments.length },
    { id: "activity", label: "Activité", icon: Activity },
    { id: "events", label: "Événements", icon: Calendar, badge: projectEvents.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20">

      {/* ── Hero Header Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${grad.from}22, ${grad.to}33)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 30% 50%, ${grad.from}, transparent 60%), radial-gradient(circle at 70% 50%, ${grad.to}, transparent 60%)` }} />
        <div className="relative max-w-[1600px] mx-auto px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 mb-6">
            <Link href="/projects" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Projets
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-700 truncate max-w-[200px]">{project.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-5">
              {/* Project Icon */}
              <div className="w-20 h-20 rounded-3xl flex-shrink-0 flex items-center justify-center shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`, boxShadow: `0 16px 48px ${grad.shadow}` }}>
                <Target className="w-10 h-10 text-white" />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-black text-white uppercase tracking-wider ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${priorityCfg.badge} uppercase tracking-wider`}>
                    {priorityCfg.label}
                  </span>
                  {project.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold bg-white/60 text-slate-600 border border-slate-200 backdrop-blur-sm">#{tag}</span>
                  ))}
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{project.name}</h1>
                <p className="text-slate-600 font-medium max-w-xl leading-relaxed">{project.description}</p>

                {/* Owner */}
                <div className="flex items-center gap-2 mt-3">
                  <UserAvatar
                    user={{
                      id: project.owner.id,
                      name: project.owner.name,
                      image: project.owner.image,
                    }}
                    size="xs"
                    className="ring-2 ring-white/20 shadow-sm"
                  />
                  <span className="text-xs font-bold text-slate-500">Chef de projet : {project.owner.name}</span>
                </div>
              </div>
            </div>

            {/* Top-right actions */}
            {canEdit && (
              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/90 hover:bg-blue-600 hover:text-white backdrop-blur-md border border-white rounded-2xl text-xs font-black text-slate-700 shadow-sm transition-all"
                >
                  <Edit className="w-4 h-4" /> Modifier
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/90 hover:bg-slate-900 hover:text-white backdrop-blur-md border border-white rounded-2xl text-xs font-black text-slate-700 shadow-sm transition-all"
                >
                  <Settings className="w-4 h-4" /> Paramètres
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-6 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-slate-500">
              <span>Progression globale</span>
              <span className="text-slate-800">{completionRate}%</span>
            </div>
            <div className="h-3 bg-white/50 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${grad.from}, ${grad.to})` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Content + Sidebar ────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-8 py-8 flex flex-col xl:flex-row gap-8">

        {/* ── Main Content ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Stats Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Tâches totales",   value: taskStats.total,      icon: ListTodo,     color: "from-slate-600 to-slate-800",     bg: "bg-slate-50", text: "text-slate-700" },
              { label: "En cours",         value: taskStats.inProgress, icon: Clock,        color: "from-blue-500 to-violet-600",     bg: "bg-blue-50",  text: "text-blue-700" },
              { label: "Terminées",        value: taskStats.done,       icon: CheckCircle2, color: "from-emerald-500 to-teal-600",   bg: "bg-emerald-50",text: "text-emerald-700" },
              { label: "Membres",          value: project.members.length,icon: Users,       color: "from-violet-500 to-pink-600",    bg: "bg-violet-50", text: "text-violet-700" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                className={`${s.bg} border border-white rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group`}>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className={`text-3xl font-black ${s.text}`}>{s.value}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Budget card */}
          {project.budget && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-900 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Budget & Dépenses</h3>
                <span className={`text-sm font-black px-3 py-1 rounded-full ${((project.spent || 0) / project.budget) > 0.9 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {Math.round(((project.spent || 0) / project.budget) * 100)}% utilisé
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-50 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Budget Total</div>
                  <div className="text-xl font-black text-slate-900">{project.budget.toLocaleString("fr-FR")} €</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4">
                  <div className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">Dépensé</div>
                  <div className="text-xl font-black text-blue-700">{(project.spent || 0).toLocaleString("fr-FR")} €</div>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Restant</div>
                  <div className="text-xl font-black text-emerald-700">{(project.budget - (project.spent || 0)).toLocaleString("fr-FR")} €</div>
                </div>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((project.spent || 0) / project.budget) * 100)}%` }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${active ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                  <Icon className={`w-4 h-4 ${active ? "" : ""}`} />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${active ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{tab.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-5">
                {/* Recent tasks */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-6 pb-4">
                    <h3 className="font-black text-slate-900 flex items-center gap-2"><ListTodo className="w-5 h-5 text-blue-500" /> Tâches récentes</h3>
                    <Link href={`/projects/${project.id}/kanban`}>
                      <button className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                        Voir Kanban <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {tasks.slice(0, 6).map(task => (
                      <div key={task.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === "DONE" ? "bg-emerald-500" : task.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-slate-300"}`} />
                        <span className={`flex-1 text-sm font-bold ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-800"} truncate`}>{task.title}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${task.status === "DONE" ? "bg-emerald-50 text-emerald-700" : task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                          {task.status === "DONE" ? "Terminée" : task.status === "IN_PROGRESS" ? "En cours" : "À faire"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Members grid */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-black text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-violet-500" /> Équipe ({project.members.length})</h3>
                    <Link href={`/projects/${project.id}/members`}>
                      <button className="text-xs font-black text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors">
                        Gérer l'équipe <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[project.owner, ...project.members].slice(0, 8).map((m, i) => (
                      <div key={m.id + i} className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl text-center hover:bg-blue-50 transition-all group">
                        <div className="mb-2 group-hover:scale-110 transition-transform">
                          <UserAvatar
                            user={{
                              id: m.id,
                              name: m.name,
                              image: m.image,
                            }}
                            size="lg"
                          />
                        </div>
                        <div className="text-xs font-black text-slate-800 truncate w-full">{m.name}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{i === 0 ? "Chef" : m.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "comments" && (
              <motion.div key="comments" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <h3 className="font-black text-slate-900 mb-4">Nouveau message</h3>
                  <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Écrivez votre message..."
                    rows={3} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-400 focus:bg-white rounded-2xl resize-none focus:outline-none transition-all text-sm font-medium mb-3" />
                  <div className="flex items-center justify-between">
                    <button onClick={handleAddComment} disabled={!newComment.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl text-xs font-black disabled:opacity-50 hover:shadow-lg transition-all ml-auto">
                      <Send className="w-4 h-4" /> Publier
                    </button>
                  </div>
                </div>
                {comments.map(c => (
                  <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}>
                        {(c.author?.name || c.author?.email || "U").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black text-slate-900">{c.author?.name || c.author?.email}</span>
                          <span className="text-xs text-slate-400 font-medium">{fmt(new Date(c.createdAt))}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed text-sm font-medium whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sidebar Raccourcis ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="xl:w-80 flex-shrink-0 space-y-5">

          {/* Quick Nav */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-2.5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Navigation rapide
            </h3>

            <ShortcutBtn icon={Kanban} label="Tableau Kanban" sublabel="Drag & drop · Trello-style"
              color="text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200"
              onClick={() => setIsKanbanOpen(true)} />

            {projectRoomId && (
              <ShortcutBtn icon={MessageSquare} label="Chat du projet" sublabel="Conversations en temps réel"
                color="text-violet-700 bg-violet-50 border-violet-100 hover:bg-violet-100 hover:border-violet-200"
                onClick={() => setIsChatOpen(true)}
                badge={comments.length} />
            )}

            <ShortcutBtn icon={Video} label="Lancer une Visio" sublabel="Conférence d'équipe HD"
              color="text-rose-700 bg-rose-50 border-rose-100 hover:bg-rose-100 hover:border-rose-200"
              onClick={() => setIsVisioOpen(true)} />

            <ShortcutBtn icon={Paperclip} label="Fichiers du projet" sublabel="Documents, images, archives"
              color="text-amber-700 bg-amber-50 border-amber-100 hover:bg-amber-100 hover:border-amber-200"
              onClick={() => setIsFilesOpen(true)} />

            <ShortcutBtn icon={BarChart3} label="Générer un rapport" sublabel="PDF · Excel · Planifié"
              color="text-emerald-700 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200"
              onClick={() => setIsReportsOpen(true)} />

            <ShortcutBtn icon={Users} label="Gérer l'équipe" sublabel={`${project.members.length + 1} membre(s)`}
              color="text-purple-700 bg-purple-50 border-purple-100 hover:bg-purple-100 hover:border-purple-200"
              onClick={() => setIsMembersOpen(true)} />
          </div>

          {/* Edit Project Button Shortcut */}
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full py-3.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl text-xs font-black text-slate-800 hover:text-blue-600 flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Edit className="w-4 h-4 text-blue-500" /> Modifier les informations du projet
            </button>
          )}

          {/* Settings Button Shortcut */}
          {canEdit && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Settings className="w-4 h-4 text-slate-300" /> Paramètres & Configuration du projet
            </button>
          )}
        </motion.div>
      </div>

      {/* ── MODAL 1: MODIFIER LE PROJET ──────────────────────────────── */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setShowEditModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Edit className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Modifier le projet</h2>
                    <p className="text-xs text-slate-500 font-medium">Ajustez le nom, la description, le budget et le statut</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Nom du projet *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium text-slate-800 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Statut</label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="in_progress">En cours</option>
                      <option value="planning">Planification</option>
                      <option value="on_hold">En pause</option>
                      <option value="completed">Terminé</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Priorité</label>
                    <select
                      value={editForm.priority}
                      onChange={e => setEditForm({ ...editForm, priority: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Budget Total (€)</label>
                    <input
                      type="number"
                      value={editForm.budget}
                      onChange={e => setEditForm({ ...editForm, budget: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Dépenses (€)</label>
                    <input
                      type="number"
                      value={editForm.spent}
                      onChange={e => setEditForm({ ...editForm, spent: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Thème Couleur du Projet</label>
                  <div className="flex gap-3">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, color: c.id })}
                        className={`w-9 h-9 rounded-2xl ${c.bg} border-4 transition-transform ${editForm.color === c.id ? "border-slate-900 scale-110" : "border-white hover:scale-105"}`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Tags (séparés par virgule)</label>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                    placeholder="design, dev, q1, marketing"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-wider"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleUpdateProject}
                  disabled={isSavingProject}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {isSavingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isSavingProject ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: PARAMÈTRES DU PROJET ────────────────────────────── */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setShowSettingsModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Paramètres du Projet</h2>
                    <p className="text-xs text-slate-500 font-medium">Préférences de confidentialité, notifications et suppression</p>
                  </div>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-6">
                {/* Section 1: Confidentialité & Accès */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" /> Confidentialité & Accès
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">Projet Privé</div>
                      <div className="text-[11px] text-slate-500">Seuls les membres invités peuvent accéder aux tâches et fichiers.</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase">Actif</span>
                  </div>
                </div>

                {/* Section 2: Notifications */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-violet-500" /> Notifications de Projet
                  </h4>
                  <div className="space-y-2 text-xs font-medium text-slate-700">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Alerte à chaque nouvelle tâche créée</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Rapport hebdomadaire par email</span>
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                    </label>
                  </div>
                </div>

                {/* Section 3: Zone Danger */}
                <div className="p-4 bg-red-50/60 border border-red-100 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> Zone de danger
                  </h4>
                  <p className="text-xs text-red-600/80 font-medium">
                    La suppression du projet effacera définitivement toutes les tâches, commentaires et fichiers associés.
                  </p>
                  <button
                    onClick={handleDeleteProject}
                    disabled={isDeletingProject}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    {isDeletingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Supprimer définitivement le projet
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-wider"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Contextual Drawers ─────────────────────────────────────── */}
      {project && (
        <>
          <ProjectKanbanDrawer
            isOpen={isKanbanOpen}
            onClose={() => setIsKanbanOpen(false)}
            projectId={project.id}
            projectName={project.name}
            tasks={tasks}
          />

          {projectRoomId && (
            <ProjectChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)}
              projectId={project.id} projectName={project.name} roomId={projectRoomId} />
          )}

          <ProjectVisioDrawer
            isOpen={isVisioOpen}
            onClose={() => setIsVisioOpen(false)}
            projectId={project.id}
            projectName={project.name}
          />

          <ProjectFilesDrawer isOpen={isFilesOpen} onClose={() => setIsFilesOpen(false)}
            projectId={project.id} projectName={project.name} />

          <ProjectReportsDrawer
            isOpen={isReportsOpen}
            onClose={() => setIsReportsOpen(false)}
            projectId={project.id}
            projectName={project.name}
            progress={project.progress}
            budget={project.budget}
            spent={project.spent}
            totalTasks={tasks.length}
            doneTasks={tasks.filter((t) => t.status === "DONE").length}
          />

          <ProjectMembersDrawer
            isOpen={isMembersOpen}
            onClose={() => setIsMembersOpen(false)}
            projectId={project.id}
            projectName={project.name}
            owner={project.owner}
            members={project.members}
          />
        </>
      )}
    </div>
  );
}

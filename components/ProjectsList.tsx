"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Grid3x3, List, LayoutList, Calendar,
  Users, CheckCircle2, Clock, AlertCircle, Folder, Star,
  Trash2, ArrowLeft, ChevronRight, TrendingUp, Loader2,
  Kanban, BarChart2, MessageSquare, Paperclip, Zap, Target,
  Activity, Eye, MoreHorizontal, GitBranch, Flag, Sparkles
} from "lucide-react";
import { Button } from "./ui/Button";
import UserAvatar from "./ui/UserAvatar";

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  startDate: string | Date | null;
  endDate: string | Date | null;
  budget?: number;
  spent?: number;
  owner: { id: string; name: string; avatar: string; image?: string; };
  members: { id: string; name: string; avatar: string; image?: string; role?: string; }[];
  tasks: { total: number; completed: number; inProgress: number; };
  isFavorite: boolean;
  color: string;
  tags: string[];
}

interface Stats {
  total: number;
  inProgress: number;
  completed: number;
  onHold: number;
}

const STATUS_CONFIG = {
  planning:    { label: 'Planification', color: 'bg-slate-500',   ring: 'ring-slate-200',  text: 'text-slate-700',  dot: 'bg-slate-400' },
  in_progress: { label: 'En cours',      color: 'bg-blue-500',    ring: 'ring-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  on_hold:     { label: 'En pause',      color: 'bg-amber-500',   ring: 'ring-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  completed:   { label: 'Terminé',       color: 'bg-emerald-500', ring: 'ring-emerald-200',text: 'text-emerald-700',dot: 'bg-emerald-500' },
  cancelled:   { label: 'Annulé',        color: 'bg-red-500',     ring: 'ring-red-200',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Basse',   badge: 'bg-slate-100 text-slate-600 border-slate-200',  icon: '▽' },
  medium: { label: 'Moyenne', badge: 'bg-blue-50 text-blue-700 border-blue-200',      icon: '◈' },
  high:   { label: 'Haute',   badge: 'bg-orange-50 text-orange-700 border-orange-200',icon: '▲' },
  urgent: { label: 'Urgente', badge: 'bg-red-50 text-red-700 border-red-200',         icon: '⚡' },
};

const GRADIENT_MAP: Record<string, { from: string; via: string; to: string; shadow: string; }> = {
  blue:   { from: '#3B82F6', via: '#6366F1', to: '#8B5CF6', shadow: 'rgba(99,102,241,0.4)' },
  green:  { from: '#10B981', via: '#059669', to: '#0D9488', shadow: 'rgba(16,185,129,0.4)' },
  orange: { from: '#F97316', via: '#F59E0B', to: '#EF4444', shadow: 'rgba(249,115,22,0.4)' },
  purple: { from: '#8B5CF6', via: '#A855F7', to: '#EC4899', shadow: 'rgba(139,92,246,0.4)' },
  red:    { from: '#EF4444', via: '#F43F5E', to: '#EC4899', shadow: 'rgba(239,68,68,0.4)' },
  cyan:   { from: '#06B6D4', via: '#0EA5E9', to: '#6366F1', shadow: 'rgba(6,182,212,0.4)' },
};

function getGradient(color: string) {
  return GRADIENT_MAP[color] || GRADIENT_MAP.blue;
}

function AvatarStack({ members, max = 4 }: { members: { id: string; name: string; avatar: string; image?: string; }[]; max?: number }) {
  return (
    <div className="flex -space-x-2">
      {members.slice(0, max).map((m, i) => (
        <div key={m.id} style={{ zIndex: max - i }} className="relative border-2 border-white rounded-full shadow-md overflow-hidden bg-white w-8 h-8 flex-shrink-0">
          <UserAvatar
            user={{
              id: m.id,
              name: m.name,
              image: m.image,
            }}
            size="sm"
          />
        </div>
      ))}
      {members.length > max && (
        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-black shadow-md" style={{ zIndex: 0 }}>
          +{members.length - max}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, currentUserId, onToggleFavorite, onDelete, deletingId }: {
  project: Project;
  currentUserId: string;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const grad = getGradient(project.color);
  const status = STATUS_CONFIG[project.status];
  const priority = PRIORITY_CONFIG[project.priority];
  const isOwner = project.owner.id === currentUserId;
  const completionRate = project.tasks.total > 0 ? Math.round((project.tasks.completed / project.tasks.total) * 100) : project.progress;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative"
    >
      {/* Glow shadow */}
      <div
        className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{ background: `linear-gradient(135deg, ${grad.from}22, ${grad.to}44)` }}
      />

      <div className="relative bg-white rounded-3xl border border-slate-100 shadow-sm group-hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full">
        {/* Top gradient accent bar */}
        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${grad.from}, ${grad.via}, ${grad.to})` }} />

        {/* Card Header */}
        <div className="p-6 pb-4 flex items-start justify-between gap-3">
          {/* Project Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300"
            style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`, boxShadow: `0 8px 24px ${grad.shadow}` }}
          >
            <Folder className="w-7 h-7 text-white" />
          </div>

          {/* Top-right actions */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={(e) => { e.preventDefault(); onToggleFavorite(project.id); }}
              className="p-2 hover:bg-amber-50 rounded-xl transition-all"
            >
              <Star className={`w-4 h-4 transition-colors ${project.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'}`} />
            </button>
            {isOwner && (
              <button
                onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
                disabled={deletingId === project.id}
                className="p-2 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                {deletingId === project.id
                  ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                  : <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500 transition-colors" />
                }
              </button>
            )}
          </div>
        </div>

        {/* Title + Badges */}
        <div className="px-6 pb-4 flex-1">
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${priority.badge}`}>
              {priority.icon} {priority.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${status.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
              {status.label}
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1 uppercase tracking-tight">
            {project.name}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">
            {project.description || "Aucune description"}
          </p>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {project.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-bold">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Task Stats Counters */}
        <div className="px-6 pb-4 grid grid-cols-3 gap-3">
          <div className="bg-slate-50 rounded-2xl p-3 text-center">
            <div className="text-lg font-black text-slate-900">{project.tasks.total}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</div>
          </div>
          <div className="bg-blue-50 rounded-2xl p-3 text-center">
            <div className="text-lg font-black text-blue-600">{project.tasks.inProgress}</div>
            <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">En cours</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 text-center">
            <div className="text-lg font-black text-emerald-600">{project.tasks.completed}</div>
            <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Terminées</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progression</span>
            <span className="text-sm font-black text-slate-800">{completionRate}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${grad.from}, ${grad.to})` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-b-3xl">
          <div className="flex items-center gap-3">
            <AvatarStack members={project.members} />
            {project.members.length === 0 && (
              <span className="text-xs text-slate-400 font-medium">Solo</span>
            )}
          </div>

          <Link href={`/projects/${project.id}`}>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all"
              style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`, boxShadow: `0 4px 16px ${grad.shadow}` }}
            >
              Ouvrir <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function ProjectListRow({ project, currentUserId, onToggleFavorite, onDelete, deletingId }: {
  project: Project;
  currentUserId: string;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const grad = getGradient(project.color);
  const status = STATUS_CONFIG[project.status];
  const priority = PRIORITY_CONFIG[project.priority];
  const isOwner = project.owner.id === currentUserId;
  const completionRate = project.tasks.total > 0 ? Math.round((project.tasks.completed / project.tasks.total) * 100) : project.progress;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="group bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-5 hover:shadow-lg hover:border-blue-100 transition-all"
    >
      {/* Color dot */}
      <div className="w-3 h-10 rounded-full flex-shrink-0" style={{ background: `linear-gradient(180deg, ${grad.from}, ${grad.to})` }} />

      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}>
        <Folder className="w-5 h-5 text-white" />
      </div>

      {/* Name + desc */}
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{project.name}</h3>
        <p className="text-xs text-slate-400 font-medium truncate">{project.description}</p>
      </div>

      {/* Status */}
      <span className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${status.color} flex-shrink-0`}>
        {status.label}
      </span>

      {/* Priority */}
      <span className={`hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border flex-shrink-0 ${priority.badge}`}>
        {priority.label}
      </span>

      {/* Progress */}
      <div className="hidden xl:flex items-center gap-3 w-36 flex-shrink-0">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${completionRate}%`, background: `linear-gradient(90deg, ${grad.from}, ${grad.to})` }} />
        </div>
        <span className="text-xs font-black text-slate-700 w-8 text-right">{completionRate}%</span>
      </div>

      {/* Members */}
      <div className="hidden md:block flex-shrink-0">
        <AvatarStack members={project.members} max={3} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={(e) => { e.preventDefault(); onToggleFavorite(project.id); }} className="p-2 hover:bg-amber-50 rounded-xl transition-all">
          <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
        </button>
        {isOwner && (
          <button onClick={(e) => { e.preventDefault(); onDelete(project.id); }} disabled={deletingId === project.id} className="p-2 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
            {deletingId === project.id ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" /> : <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" />}
          </button>
        )}
        <Link href={`/projects/${project.id}`}>
          <button className="p-2 hover:bg-blue-50 rounded-xl transition-all">
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function ProjectsList({ projects, currentUserId, stats }: {
  projects: Project[];
  currentUserId: string;
  stats?: Stats;
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'date'>('date');
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const toggleFavorite = async (projectId: string) => {
    const project = localProjects.find(p => p.id === projectId);
    if (!project) return;
    setLocalProjects(prev => prev.map(p => p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p));
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !project.isFavorite }),
      });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Supprimer définitivement ce projet ?')) return;
    setDeletingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects?id=${projectId}`, { method: 'DELETE' });
      if (response.ok) setLocalProjects(prev => prev.filter(p => p.id !== projectId));
    } catch { alert('Erreur lors de la suppression'); }
    finally { setDeletingProjectId(null); }
  };

  const filteredProjects = localProjects
    .filter(p => {
      const q = searchQuery.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'progress') return b.progress - a.progress;
      return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
    });

  const favorites = filteredProjects.filter(p => p.isFavorite);
  const others = filteredProjects.filter(p => !p.isFavorite);

  return (
    <div className="space-y-10">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Tableau de bord
            </button>
          </Link>
          <div>
            <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight">
              Mes <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Projets</span>
            </h1>
            <p className="text-slate-500 mt-2 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {filteredProjects.length} initiative{filteredProjects.length > 1 ? 's' : ''} active{filteredProjects.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link href="/projects/new">
          <Button variant="primary" className="rounded-2xl py-4 px-8 h-auto font-black uppercase tracking-wider shadow-2xl shadow-blue-500/25 group">
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Nouveau projet
          </Button>
        </Link>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats?.total ?? 0, icon: Folder, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200' },
          { label: 'En cours', value: stats?.inProgress ?? 0, icon: Activity, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-200' },
          { label: 'Terminés', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200' },
          { label: 'En pause', value: stats?.onHold ?? 0, icon: AlertCircle, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-200' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
            className={`bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-lg transition-all`}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg ${s.shadow} flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">{s.value}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher un projet, un tag, une description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-400 focus:bg-white transition-all font-semibold text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 outline-none focus:border-blue-400 focus:bg-white transition-all">
            <option value="all">Tous statuts</option>
            <option value="in_progress">En cours</option>
            <option value="planning">Planification</option>
            <option value="on_hold">En pause</option>
            <option value="completed">Terminés</option>
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-600 outline-none focus:border-blue-400 focus:bg-white transition-all">
            <option value="date">Par date</option>
            <option value="name">Par nom</option>
            <option value="progress">Par progression</option>
          </select>

          {/* View toggles */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutList className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {filteredProjects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
          <div className="w-28 h-28 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 rotate-12 hover:rotate-0 transition-transform duration-700">
            <Folder className="w-14 h-14 text-slate-300" />
          </div>
          <h3 className="text-3xl font-display font-black text-slate-800 mb-3">Aucun projet trouvé</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10">Créez votre premier projet pour mobiliser vos équipes vers un objectif commun.</p>
          <Link href="/projects/new">
            <Button variant="primary" className="rounded-2xl py-4 px-10 h-auto font-black shadow-xl shadow-blue-500/20">
              <Plus className="w-5 h-5 mr-2" /> Créer un projet
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Favorites section */}
          {favorites.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-500 mb-4">
                <Star className="w-4 h-4 fill-amber-400" /> Favoris ({favorites.length})
              </h2>
              <AnimatePresence mode="popLayout">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {favorites.map(p => (
                      <ProjectCard key={p.id} project={p} currentUserId={currentUserId} onToggleFavorite={toggleFavorite} onDelete={handleDelete} deletingId={deletingProjectId} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favorites.map(p => (
                      <ProjectListRow key={p.id} project={p} currentUserId={currentUserId} onToggleFavorite={toggleFavorite} onDelete={handleDelete} deletingId={deletingProjectId} />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* All projects */}
          {others.length > 0 && (
            <div>
              {favorites.length > 0 && (
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                  <Folder className="w-4 h-4" /> Tous les projets ({others.length})
                </h2>
              )}
              <AnimatePresence mode="popLayout">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {others.map(p => (
                      <ProjectCard key={p.id} project={p} currentUserId={currentUserId} onToggleFavorite={toggleFavorite} onDelete={handleDelete} deletingId={deletingProjectId} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {others.map(p => (
                      <ProjectListRow key={p.id} project={p} currentUserId={currentUserId} onToggleFavorite={toggleFavorite} onDelete={handleDelete} deletingId={deletingProjectId} />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

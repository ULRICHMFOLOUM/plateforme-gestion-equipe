"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Grid3x3,
  List,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Folder,
  Star,
  Trash2,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card, StatCard } from "./ui/Card";
import { Button } from "./ui/Button";

// Types
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
  owner: {
    id: string;
    name: string;
    avatar: string;
  };
  members: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
  }[];
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
  };
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

interface ProjectsListProps {
  projects: Project[];
  currentUserId: string;
  stats?: Stats;
}

export default function ProjectsList({
  projects,
  currentUserId,
  stats,
}: ProjectsListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'date'>('date');
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  const statusConfig = {
    planning: { label: 'Planification', color: 'bg-slate-500', icon: Calendar },
    in_progress: { label: 'En cours', color: 'bg-blue-600', icon: Clock },
    on_hold: { label: 'En pause', color: 'bg-orange-500', icon: AlertCircle },
    completed: { label: 'Terminé', color: 'bg-emerald-500', icon: CheckCircle2 },
    cancelled: { label: 'Annulé', color: 'bg-red-500', icon: AlertCircle },
  };

  const priorityConfig = {
    low: { label: 'Basse', color: 'text-slate-600', bg: 'bg-slate-100' },
    medium: { label: 'Moyenne', color: 'text-blue-600', bg: 'bg-blue-100' },
    high: { label: 'Haute', color: 'text-orange-600', bg: 'bg-orange-100' },
    urgent: { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-100' },
  };

  const colorConfig: Record<string, string> = {
    blue: 'from-blue-600 to-indigo-600',
    green: 'from-emerald-500 to-teal-500',
    orange: 'from-orange-500 to-amber-500',
    purple: 'from-purple-600 to-pink-600',
    red: 'from-red-600 to-rose-600',
  };

  const toggleFavorite = async (projectId: string) => {
    const project = localProjects.find(p => p.id === projectId);
    if (!project) return;

    setLocalProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p)
    );

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !project.isFavorite }),
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredProjects = localProjects
    .filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' || project.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'progress') return b.progress - a.progress;
      if (sortBy === 'date') return new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime();
      return 0;
    });

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Supprimer définitivement ce projet ?')) return;
    setDeletingProjectId(projectId);
    try {
      const response = await fetch(`/api/projects?id=${projectId}`, { method: 'DELETE' });
      if (response.ok) window.location.reload();
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingProjectId(null);
    }
  };

  return (
    <div className="space-y-10">
      {/* Background Blobs */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-400/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-4">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Tableau de bord
            </button>
          </Link>
          <div>
            <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight">
              Espace <span className="text-blue-600">Projets</span>
            </h1>
            <p className="text-slate-500 mt-2 font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              {filteredProjects.length} initiative{filteredProjects.length > 1 ? 's' : ''} en cours
            </p>
          </div>
        </div>

        <Link href="/projects/new">
          <Button variant="primary" className="rounded-[1.5rem] py-4 px-8 h-auto font-black uppercase tracking-widest shadow-2xl shadow-blue-500/20 group">
            <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-500" />
            Lancer un projet
          </Button>
        </Link>
      </motion.div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Folder} label="Total" value={stats?.total.toString() || "0"} color="blue" />
        <StatCard icon={Clock} label="Actifs" value={stats?.inProgress.toString() || "0"} color="orange" />
        <StatCard icon={CheckCircle2} label="Terminés" value={stats?.completed.toString() || "0"} color="green" />
        <StatCard icon={AlertCircle} label="En pause" value={stats?.onHold.toString() || "0"} color="red" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher une mission, un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white/60 backdrop-blur-md border-2 border-white rounded-[2rem] focus:outline-none focus:border-blue-400 transition-all font-bold text-slate-900 shadow-sm"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-5 bg-white/60 backdrop-blur-md border-2 border-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-slate-600 outline-none focus:border-blue-400"
          >
            <option value="all">Tous les Statuts</option>
            <option value="in_progress">En cours</option>
            <option value="planning">Planification</option>
            <option value="on_hold">En pause</option>
            <option value="completed">Terminés</option>
          </select>
          <div className="flex gap-1.5 p-1.5 bg-white/60 backdrop-blur-md border-2 border-white rounded-[2rem] shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-[1.5rem] transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white'}`}><Grid3x3 className="w-5 h-5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-[1.5rem] transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white'}`}><List className="w-5 h-5" /></button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      <AnimatePresence mode="popLayout">
        {filteredProjects.length > 0 ? (
          <motion.div
            layout
            className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8' : 'space-y-4'}
          >
            {filteredProjects.map((project) => {
              const status = statusConfig[project.status];
              const priority = priorityConfig[project.priority];
              const isOwner = project.owner.id === currentUserId;

              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card className="h-full p-0 relative overflow-hidden border-2 border-white/50 bg-white/50 backdrop-blur-xl rounded-[2.5rem] hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all">
                    <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${colorConfig[project.color] || colorConfig.blue}`} />
                    
                    <div className="p-8 pb-4 flex justify-between items-start">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorConfig[project.color] || colorConfig.blue} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                        <Folder className="w-7 h-7" />
                      </div>
                      <button onClick={(e) => { e.preventDefault(); toggleFavorite(project.id); }} className="p-3 bg-white/80 hover:bg-white rounded-[1.25rem] shadow-sm transition-all"><Star className={`w-5 h-5 ${project.isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300'}`} /></button>
                    </div>

                    <div className="px-8 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${status.color}`}>{status.label}</span>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${priority.bg} ${priority.color}`}>{priority.label}</span>
                      </div>
                      <h3 className="text-2xl font-display font-black text-slate-800 mb-2 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{project.name}</h3>
                      <p className="text-slate-500 font-medium text-sm line-clamp-2 leading-relaxed">{project.description}</p>
                    </div>

                    <div className="px-8 mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progression</span>
                        <span className="text-sm font-black text-slate-900">{project.progress}%</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} className={`h-full bg-gradient-to-r ${colorConfig[project.color] || colorConfig.blue} rounded-full`} />
                      </div>
                    </div>

                    <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex -space-x-3">
                        {project.members.slice(0, 4).map((m) => (
                          <div key={m.id} className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 border-4 border-white flex items-center justify-center text-white text-xs font-black shadow-md" title={m.name}>{m.avatar}</div>
                        ))}
                        {project.members.length > 4 && <div className="w-10 h-10 rounded-2xl bg-white border-4 border-slate-50 flex items-center justify-center text-slate-400 text-xs font-black shadow-md">+{project.members.length - 4}</div>}
                      </div>
                      <Link href={`/projects/${project.id}`} className="p-4 bg-white hover:bg-slate-900 group/link rounded-2xl shadow-sm transition-all">
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover/link:text-white group-hover/link:translate-x-1 transition-all" />
                      </Link>
                    </div>

                    {isOwner && (
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deletingProjectId === project.id}
                        className="absolute top-24 right-8 p-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-all shadow-lg border-2 border-red-100"
                      >
                        {deletingProjectId === project.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-40">
            <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mx-auto mb-10 rotate-12 group hover:rotate-0 transition-transform duration-700">
              <Folder className="w-16 h-16 text-slate-300" />
            </div>
            <h3 className="text-4xl font-display font-black text-slate-900 mb-4 uppercase tracking-tighter">Horizon vide</h3>
            <p className="text-slate-500 font-bold max-w-sm mx-auto mb-12">Il est temps de donner vie à vos idées. Créez votre premier projet pour mobiliser vos équipes.</p>
            <Link href="/projects/new">
              <Button variant="primary" className="rounded-[2rem] py-6 px-12 h-auto text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20">
                Initialiser le futur
              </Button>
            </Link>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

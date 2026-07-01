"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Filter, CheckSquare, Clock, AlertTriangle,
  User, Calendar, Edit, Trash2, CheckCircle2, Tag,
  Layout, List as ListIcon, ChevronRight, X, Loader2,
  Circle, ArrowLeft, FolderOpen, Columns,
} from "lucide-react";
import { Card, StatCard } from "./ui/Card";
import { Button } from "./ui/Button";
import UserAvatar from "./ui/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KanbanView from "./KanbanView";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: Date | string | null;
  assignee?: { name: string; email: string; image?: string };
  project?: { id: string; name: string };
}

interface TasksListProps {
  tasks: Task[];
  currentUserId: string;
}

const STATUS_CONFIG = {
  TODO: { label: "À faire", color: "bg-slate-100 text-slate-600", icon: Circle },
  IN_PROGRESS: { label: "En cours", color: "bg-blue-100 text-blue-600", icon: Clock },
  DONE: { label: "Terminé", color: "bg-green-100 text-green-600", icon: CheckCircle2 },
};

const PRIORITY_CONFIG = {
  LOW: { label: "Basse", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  MEDIUM: { label: "Moyenne", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  HIGH: { label: "Haute", color: "text-red-700", bg: "bg-red-50 border-red-200" },
};

// ─────────────────────────────────────────────
// Create Task Modal
// ─────────────────────────────────────────────
function CreateTaskModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Le titre est requis"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dueDate: form.dueDate || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur"); }
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-display font-bold text-slate-900">Nouvelle tâche</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Titre *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Revoir la maquette..."
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Détails optionnels..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Priorité</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Échéance</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={loading} className="flex-1" icon={Plus}>
              Créer la tâche
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Edit Task Modal
// ─────────────────────────────────────────────
function EditTaskModal({
  task,
  onClose,
  onUpdated,
}: {
  task: Task;
  onClose: () => void;
  onUpdated: (updated: Task) => void;
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dueDate: form.dueDate || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur"); }
      const updated = await res.json();
      onUpdated({ ...task, ...updated });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-display font-bold text-slate-900">Modifier la tâche</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">{error}</div>}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Titre *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Statut</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all">
                <option value="TODO">À faire</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="DONE">Terminé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Priorité</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all">
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Échéance</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Annuler</Button>
            <Button type="submit" variant="primary" loading={loading} className="flex-1">Enregistrer</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function TasksList({ tasks: initialTasks, currentUserId }: TasksListProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "kanban">("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    todo: tasks.filter((t) => t.status === "TODO").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: tasks.filter((t) => t.status === "DONE").length,
    high: tasks.filter((t) => t.priority === "HIGH").length,
  };

  // Toggle status: TODO → IN_PROGRESS → DONE → TODO
  const toggleStatus = useCallback(async (task: Task) => {
    const cycle: Task["status"][] = ["TODO", "IN_PROGRESS", "DONE"];
    const nextStatus = cycle[(cycle.indexOf(task.status) + 1) % cycle.length];
    setTogglingId(task.id);
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: nextStatus } : t));
    try {
      await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
    } finally {
      setTogglingId(null);
    }
  }, []);

  // Delete task
  const deleteTask = useCallback(async (id: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    setDeletingId(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } catch {
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }, [router]);

  const isOverdue = (dueDate: Date | string | null | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" icon={ArrowLeft} className="text-slate-500 hover:text-blue-600">
                Tableau de bord
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
            Mes <span className="text-blue-600">Tâches</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            {filteredTasks.length} tâche{filteredTasks.length > 1 ? "s" : ""} • Suivez votre progression
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setViewMode("list")} className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"}`} title="Vue liste">
              <ListIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"}`} title="Vue grille">
              <Layout className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode("kanban")} className={`p-2 rounded-xl transition-all ${viewMode === "kanban" ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"}`} title="Vue Kanban">
              <Columns className="w-5 h-5" />
            </button>
          </div>
          <Button variant="primary" className="rounded-2xl shadow-xl shadow-blue-500/20" icon={Plus} onClick={() => setShowCreateModal(true)}>
            Nouvelle Tâche
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ListIcon} label="À faire" value={stats.todo} color="blue" onClick={() => setStatusFilter("TODO")} />
        <StatCard icon={Clock} label="En cours" value={stats.inProgress} color="orange" onClick={() => setStatusFilter("IN_PROGRESS")} />
        <StatCard icon={CheckCircle2} label="Terminées" value={stats.done} color="green" onClick={() => setStatusFilter("DONE")} />
        <StatCard icon={AlertTriangle} label="Haute Priorité" value={stats.high} color="red" onClick={() => setPriorityFilter("HIGH")} />
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border-none shadow-xl shadow-slate-200/50 bg-white/60 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher une tâche, un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 pl-11 pr-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all border border-transparent focus:border-blue-500/50"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="ALL">Tous les statuts</option>
              <option value="TODO">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="DONE">Terminé</option>
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="ALL">Toutes les priorités</option>
              <option value="LOW">Basse</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Haute</option>
            </select>
            {(statusFilter !== "ALL" || priorityFilter !== "ALL" || searchTerm) && (
              <button onClick={() => { setStatusFilter("ALL"); setPriorityFilter("ALL"); setSearchTerm(""); }}
                className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1">
                <X className="w-3 h-3" /> Effacer
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ─── KANBAN VIEW ─── */}
      {viewMode === "kanban" && (
        <KanbanView
          tasks={filteredTasks}
          onStatusChange={async (taskId, newStatus) => {
            setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
            try {
              await fetch(`/api/tasks/${taskId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
              });
            } catch {
              router.refresh();
            }
          }}
          onEdit={setEditingTask}
          onDelete={deleteTask}
          onCreateInColumn={(status) => setShowCreateModal(true)}
        />
      )}

      {/* ─── LIST / GRID VIEW ─── */}
      {viewMode !== "kanban" && (
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-3"}>
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task, index) => {
            const statusCfg = STATUS_CONFIG[task.status];
            const priorityCfg = PRIORITY_CONFIG[task.priority];
            const StatusIcon = statusCfg.icon;
            const overdue = isOverdue(task.dueDate) && task.status !== "DONE";

            return (
              <motion.div
                layout
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className={`group ${viewMode === "grid" ? "flex flex-col" : "flex items-center"} p-5 bg-white border ${task.status === "DONE" ? "border-slate-100 opacity-70" : "border-slate-200/70"} rounded-2xl hover:shadow-xl hover:shadow-blue-500/8 transition-all`}
              >
                {/* Status toggle button */}
                <button
                  onClick={() => toggleStatus(task)}
                  disabled={togglingId === task.id}
                  className={`flex-shrink-0 p-2 rounded-xl ${statusCfg.color} hover:scale-110 transition-transform mr-4 ${viewMode === "grid" ? "self-start" : ""}`}
                  title={`Statut: ${statusCfg.label} – Cliquez pour changer`}
                >
                  {togglingId === task.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <StatusIcon className="w-5 h-5" />
                  )}
                </button>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${viewMode === "grid" ? "mt-3" : ""}`}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${priorityCfg.bg} ${priorityCfg.color}`}>
                      {priorityCfg.label}
                    </span>
                    {task.project && (
                      <Link href={`/projects/${task.project.id}`}>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-colors">
                          <FolderOpen className="w-3 h-3" />
                          {task.project.name}
                        </span>
                      </Link>
                    )}
                    {overdue && (
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> En retard
                      </span>
                    )}
                  </div>
                  <h3 className={`text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors ${task.status === "DONE" ? "line-through text-slate-400" : ""}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                </div>

                {/* Right side */}
                <div className={`flex items-center gap-4 ${viewMode === "grid" ? "mt-4 pt-4 border-t border-slate-100 w-full" : "ml-4 flex-shrink-0"}`}>
                  {/* Due date */}
                  {task.dueDate && (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${overdue ? "text-red-500" : "text-slate-400"}`}>
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </div>
                  )}

                  {/* Assignee */}
                  {task.assignee ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <UserAvatar src={task.assignee.image} name={task.assignee.name} size="xs" className="border-2 border-white ring-2 ring-slate-100" />
                      <span className="hidden lg:block font-medium truncate max-w-[80px]">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center" title="Non assigné">
                      <User className="w-3 h-3 text-slate-400" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      disabled={deletingId === task.id}
                      className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      {deletingId === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      )} {/* end viewMode !== kanban */}

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckSquare className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-display font-black text-slate-900">Tout est à jour !</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2">
            {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
              ? "Aucune tâche ne correspond à vos filtres."
              : "Vous n'avez aucune tâche pour le moment. Créez-en une !"}
          </p>
          {!(searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL") && (
            <Button variant="primary" icon={Plus} className="mt-6" onClick={() => setShowCreateModal(true)}>
              Créer une tâche
            </Button>
          )}
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateTaskModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(task) => setTasks((prev) => [task, ...prev])}
          />
        )}
        {editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onUpdated={(updated) => {
              setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
              setEditingTask(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

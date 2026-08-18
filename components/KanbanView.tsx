"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Circle, Clock, CheckCircle2, AlertTriangle,
  Calendar, User, Edit, Trash2, Loader2, FolderOpen, X,
  Tag, CheckSquare, Paperclip, Archive, Sparkles, Filter, Eye,
} from "lucide-react";
import Link from "next/link";
import UserAvatar from "./ui/UserAvatar";
import { showToast } from "./ui/Toast";

interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: Date | string | null;
  assignee?: { name: string; email: string; image?: string };
  project?: { id: string; name: string };
  tags?: string[];
  subtasks?: SubTask[];
  coverUrl?: string;
  isArchived?: boolean;
}

interface KanbanViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: Task["status"]) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onCreateInColumn: (status: Task["status"]) => void;
}

const COLUMNS: { id: Task["status"]; label: string; icon: React.ElementType; color: string; bg: string; border: string; accent: string }[] = [
  {
    id: "TODO",
    label: "À faire",
    icon: Circle,
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    accent: "bg-slate-400",
  },
  {
    id: "IN_PROGRESS",
    label: "En cours",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50/60",
    border: "border-blue-200",
    accent: "bg-blue-500",
  },
  {
    id: "DONE",
    label: "Terminé",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50/60",
    border: "border-emerald-200",
    accent: "bg-emerald-500",
  },
];

const PRIORITY_CONFIG = {
  LOW: { label: "Basse", dot: "bg-emerald-400", text: "text-emerald-700", badge: "bg-emerald-50 border-emerald-200" },
  MEDIUM: { label: "Moyenne", dot: "bg-amber-400", text: "text-amber-700", badge: "bg-amber-50 border-amber-200" },
  HIGH: { label: "Haute", dot: "bg-red-400", text: "text-red-700", badge: "bg-red-50 border-red-200" },
};

function KanbanCard({
  task,
  onEdit,
  onDelete,
  onToggleSubtask,
  onArchive,
  onDragStart,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onArchive: (taskId: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  const subtasksDone = (task.subtasks || []).filter((s) => s.done).length;
  const subtasksTotal = (task.subtasks || []).length;
  const subtasksPercent = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task)}
      className={`group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-blue-500/8 transition-all cursor-grab active:cursor-grabbing active:scale-[0.98] select-none overflow-hidden ${
        task.status === "DONE" ? "opacity-75" : ""
      }`}
    >
      {/* Visual Cover Attachment Image (Trello-style Cover) */}
      {task.coverUrl && (
        <div className="h-28 w-full bg-slate-100 relative overflow-hidden">
          <img src={task.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Priority + Project + Tags row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${priorityCfg.badge} ${priorityCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
            {priorityCfg.label}
          </span>

          {task.tags && task.tags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-lg text-[9px] font-bold text-violet-700 bg-violet-50 border border-violet-200">
              #{t}
            </span>
          ))}

          {task.project && (
            <Link href={`/projects/${task.project.id}`} onClick={(e) => e.stopPropagation()}>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors">
                <FolderOpen className="w-3 h-3" />
                {task.project.name}
              </span>
            </Link>
          )}

          {isOverdue && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
              <AlertTriangle className="w-3 h-3" /> Retard
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className={`text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors ${task.status === "DONE" ? "line-through text-slate-400" : ""}`}>
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Subtasks checklist & progress bar (Trello-style) */}
        {subtasksTotal > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3 text-blue-500" /> Checklist</span>
              <span>{subtasksDone}/{subtasksTotal} ({Math.round(subtasksPercent)}%)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${subtasksPercent}%` }}
              />
            </div>
            {/* Direct click checklist items */}
            <div className="space-y-1 pt-1">
              {task.subtasks?.map((st) => (
                <button
                  key={st.id}
                  onClick={(e) => { e.stopPropagation(); onToggleSubtask(task.id, st.id); }}
                  className="flex items-center gap-2 text-left w-full hover:bg-slate-50 p-1 rounded-lg transition-colors"
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${st.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"}`}>
                    {st.done && "✓"}
                  </span>
                  <span className={`text-xs ${st.done ? "line-through text-slate-400" : "text-slate-700 font-medium"}`}>{st.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </span>
            )}

            {task.assignee ? (
              <UserAvatar user={task.assignee} size="xs" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center">
                <User className="w-2.5 h-2.5 text-slate-400" />
              </div>
            )}
          </div>

          {/* Hover actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(task.id); }}
              className="p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-all"
              title="Archiver la carte (façon Butler)"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
              title="Modifier"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              disabled={deleting}
              className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function KanbanView({ tasks: initialTasks, onStatusChange, onEdit, onDelete, onCreateInColumn }: KanbanViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggingOver, setDraggingOver] = useState<Task["status"] | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [showButlerAuto, setShowButlerAuto] = useState(false);

  const draggedTask = useRef<Task | null>(null);

  // Butler auto-archive rule: Archive all DONE tasks older than 7 days
  const runButlerAutomation = () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const toArchive = tasks.filter((t) => t.status === "DONE" && !t.isArchived);
    setTasks((prev) => prev.map((t) => (t.status === "DONE" ? { ...t, isArchived: true } : t)));
    showToast({
      type: "success",
      title: "Automate Butler exécuté !",
      message: `${toArchive.length} tâche(s) terminée(s) archivée(s) automatiquement.`,
    });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubs = (t.subtasks || []).map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s));
        return { ...t, subtasks: updatedSubs };
      })
    );
  };

  const handleArchive = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast({ type: "info", title: "Carte archivée", message: "La carte peut être restaurée depuis l'historique." });
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    draggedTask.current = task;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggingOver(status);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task["status"]) => {
    e.preventDefault();
    setDraggingOver(null);
    const task = draggedTask.current;
    if (!task || task.status === targetStatus) return;
    draggedTask.current = null;

    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: targetStatus } : t)));
    await onStatusChange(task.id, targetStatus);
  };

  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags || [])));
  const visibleTasks = tasks.filter((t) => !t.isArchived && (selectedTag === "all" || (t.tags || []).includes(selectedTag)));

  return (
    <div className="space-y-4">
      {/* Trello Power-Ups Bar */}
      <div className="flex items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" /> Power-Ups :
          </span>
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedTag("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${selectedTag === "all" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600"}`}
              >
                Tous les tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${selectedTag === tag ? "bg-violet-600 text-white shadow-sm" : "bg-violet-50 text-violet-600 hover:bg-violet-100"}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runButlerAutomation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl transition-all"
            title="Lancer l'automatisation Butler"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Automate Butler (Archiver terminées)
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-5 overflow-x-auto pb-6 -mx-2 px-2">
        {COLUMNS.map((col) => {
          const colTasks = visibleTasks.filter((t) => t.status === col.id);
          const Icon = col.icon;
          const isOver = draggingOver === col.id;

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-80 flex flex-col"
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragLeave={() => setDraggingOver(null)}
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-2xl mb-3 border-2 transition-all ${isOver ? `${col.bg} ${col.border} shadow-lg` : "bg-white/80 border-transparent"}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-8 rounded-full ${col.accent}`} />
                  <Icon className={`w-4 h-4 ${col.color}`} />
                  <span className={`text-sm font-black uppercase tracking-wider ${col.color}`}>{col.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${col.bg} ${col.color} border ${col.border}`}>{colTasks.length}</span>
                </div>
                <button onClick={() => onCreateInColumn(col.id)} className={`p-1.5 rounded-xl ${col.color} hover:${col.bg} transition-all`}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column cards */}
              <div className={`flex-1 min-h-[200px] rounded-2xl transition-all duration-200 space-y-3 p-2 ${isOver ? `${col.bg} border-2 border-dashed ${col.border}` : "bg-slate-50/30 border-2 border-transparent"}`}>
                <AnimatePresence mode="popLayout">
                  {colTasks.map((task) => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleSubtask={handleToggleSubtask}
                      onArchive={handleArchive}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </AnimatePresence>

                {colTasks.length === 0 && !isOver && (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                    <Icon className="w-6 h-6 opacity-30 mb-2" />
                    <p className="text-xs font-medium">Déposez une carte ici</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

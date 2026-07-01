"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Circle, Clock, CheckCircle2, AlertTriangle,
  Calendar, User, Edit, Trash2, Loader2, FolderOpen, X
} from "lucide-react";
import Link from "next/link";
import UserAvatar from "./ui/UserAvatar";

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
  onDragStart,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  const handleDelete = async () => {
    if (!confirm("Supprimer cette tâche ?")) return;
    setDeleting(true);
    onDelete(task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, task)}
      className={`group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-blue-500/8 transition-all cursor-grab active:cursor-grabbing active:scale-[0.98] active:shadow-2xl active:border-blue-300 select-none ${
        task.status === "DONE" ? "opacity-60" : ""
      }`}
    >
      <div className="p-4 space-y-3">
        {/* Priority + Project row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${priorityCfg.badge} ${priorityCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
            {priorityCfg.label}
          </span>
          {task.project && (
            <Link href={`/projects/${task.project.id}`} onClick={(e) => e.stopPropagation()}>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors">
                <FolderOpen className="w-3 h-3" />
                {task.project.name}
              </span>
            </Link>
          )}
          {isOverdue && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-600">
              <AlertTriangle className="w-3 h-3" />
              Retard
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {/* Due date */}
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </span>
            )}

            {/* Assignee */}
            {task.assignee ? (
              <UserAvatar src={task.assignee.image} name={task.assignee.name} size="xs" className="border-2 border-white ring-1 ring-slate-100" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center">
                <User className="w-2.5 h-2.5 text-slate-400" />
              </div>
            )}
          </div>

          {/* Actions — visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
              title="Modifier"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              disabled={deleting}
              className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
              title="Supprimer"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function KanbanView({ tasks, onStatusChange, onEdit, onDelete, onCreateInColumn }: KanbanViewProps) {
  const [draggingOver, setDraggingOver] = useState<Task["status"] | null>(null);
  const draggedTask = useRef<Task | null>(null);

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
    await onStatusChange(task.id, targetStatus);
  };

  const handleDragLeave = () => setDraggingOver(null);

  return (
    <div className="flex gap-5 overflow-x-auto pb-6 -mx-2 px-2">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const Icon = col.icon;
        const isOver = draggingOver === col.id;

        return (
          <div
            key={col.id}
            className="flex-shrink-0 w-80 flex flex-col"
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragLeave={handleDragLeave}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl mb-3 border-2 transition-all ${
              isOver
                ? `${col.bg} ${col.border} shadow-lg`
                : "bg-white/80 border-transparent"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-8 rounded-full ${col.accent}`} />
                <Icon className={`w-4 h-4 ${col.color}`} />
                <span className={`text-sm font-black uppercase tracking-wider ${col.color}`}>
                  {col.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${col.bg} ${col.color} border ${col.border}`}>
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onCreateInColumn(col.id)}
                className={`p-1.5 rounded-xl ${col.color} hover:${col.bg} transition-all opacity-60 hover:opacity-100`}
                title={`Ajouter dans ${col.label}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Drop Zone */}
            <div
              className={`flex-1 min-h-[200px] rounded-2xl transition-all duration-200 space-y-3 p-2 ${
                isOver
                  ? `${col.bg} border-2 border-dashed ${col.border}`
                  : "bg-slate-50/30 border-2 border-transparent"
              }`}
            >
              <AnimatePresence mode="popLayout">
                {colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDragStart={handleDragStart}
                  />
                ))}
              </AnimatePresence>

              {/* Empty column hint */}
              {colTasks.length === 0 && !isOver && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className={`w-10 h-10 rounded-2xl ${col.bg} border ${col.border} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${col.color} opacity-40`} />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Déposez une carte ici</p>
                </div>
              )}

              {/* Drop indicator */}
              {isOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`h-16 rounded-2xl border-2 border-dashed ${col.border} flex items-center justify-center`}
                >
                  <span className={`text-xs font-bold ${col.color}`}>Déposer ici</span>
                </motion.div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

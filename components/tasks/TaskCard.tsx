"use client";
/**
 * Composant : TaskCard
 * Réutilisable partout (Kanban, Liste, Dashboard, Chat)
 * Intègre UserAvatar, badges de priorité/statut et actions rapides
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock, CheckCircle2, Circle, AlertTriangle, MoreHorizontal,
  Calendar, User as UserIcon, Tag, ChevronRight, CheckSquare,
  Trash2, Edit3, ArrowRight,
} from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import Link from "next/link";

export interface TaskCardData {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: Date | string | null;
  assignee?: {
    name?: string | null;
    email: string;
    image?: string | null;
    id?: string;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
  tags?: string[];
  subtasks?: { id: string; text: string; done: boolean }[];
}

interface TaskCardProps {
  task: TaskCardData;
  variant?: "kanban" | "list" | "compact";
  onStatusChange?: (id: string, status: TaskCardData["status"]) => void;
  onDelete?: (id: string) => void;
  onEdit?: (task: TaskCardData) => void;
  showProject?: boolean;
  dragging?: boolean;
}

const STATUS_CONFIG = {
  TODO: {
    label: "À faire",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Circle,
    dot: "bg-slate-400",
  },
  IN_PROGRESS: {
    label: "En cours",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock,
    dot: "bg-blue-500",
  },
  DONE: {
    label: "Terminé",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
  },
};

const PRIORITY_CONFIG = {
  LOW: {
    label: "Basse",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  MEDIUM: {
    label: "Moyenne",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  HIGH: {
    label: "Haute",
    color: "text-red-700 bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `En retard (${Math.abs(diffDays)}j)`;
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function isOverdue(date?: Date | string | null, status?: string): boolean {
  if (!date || status === "DONE") return false;
  return new Date(date) < new Date();
}

export default function TaskCard({
  task,
  variant = "kanban",
  onStatusChange,
  onDelete,
  onEdit,
  showProject = true,
  dragging = false,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusCfg = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const StatusIcon = statusCfg.icon;
  const overdue = isOverdue(task.dueDate, task.status);

  const nextStatus: Record<TaskCardData["status"], TaskCardData["status"]> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "DONE",
    DONE: "TODO",
  };

  const handleCycleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onStatusChange || isUpdating) return;
    setIsUpdating(true);
    try {
      await onStatusChange(task.id, nextStatus[task.status]);
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Compact variant (for dashboard widgets) ──
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all hover:shadow-md ${task.status === "DONE" ? "bg-slate-50/50 opacity-70" : "bg-white border-slate-200"}`}>
        <button
          onClick={handleCycleStatus}
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === "DONE" ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-blue-500"}`}
        >
          {task.status === "DONE" && <CheckSquare className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-900"}`}>{task.title}</p>
          {task.project && <p className="text-[10px] text-slate-400 truncate">{task.project.name}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {task.dueDate && (
            <span className={`text-[10px] font-bold ${overdue ? "text-red-600" : "text-slate-400"}`}>{formatDate(task.dueDate)}</span>
          )}
          {task.assignee && <UserAvatar user={task.assignee} size="xs" />}
        </div>
      </div>
    );
  }

  // ── List variant ──
  if (variant === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={`group flex items-center gap-4 px-5 py-4 border-b border-slate-100 hover:bg-blue-50/30 transition-all ${task.status === "DONE" ? "opacity-60" : ""}`}
      >
        {/* Status toggle */}
        <button
          onClick={handleCycleStatus}
          className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === "DONE" ? "bg-emerald-500 border-emerald-500 text-white" : task.status === "IN_PROGRESS" ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-blue-400"}`}
        >
          <StatusIcon className={`w-4 h-4 ${task.status === "DONE" ? "text-white" : task.status === "IN_PROGRESS" ? "text-blue-500" : "text-slate-400"}`} />
        </button>

        {/* Title & tags */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold text-sm ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-900"}`}>{task.title}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${priorityCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />{priorityCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {showProject && task.project && (
              <span className="text-[10px] text-slate-400 font-bold">{task.project.name}</span>
            )}
            {task.dueDate && (
              <span className={`text-[10px] font-bold flex items-center gap-1 ${overdue ? "text-red-600" : "text-slate-400"}`}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
                {overdue && " ⚠️"}
              </span>
            )}
          </div>
        </div>

        {/* Assignee */}
        {task.assignee && (
          <UserAvatar user={task.assignee} size="xs" showName={false} />
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(task.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <Link href={`/tasks/${task.id}`} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Kanban variant (default) ──
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className={`relative bg-white rounded-2xl border p-4 shadow-sm hover:shadow-lg transition-all group cursor-grab active:cursor-grabbing ${dragging ? "shadow-2xl rotate-2 scale-105" : ""} ${task.status === "DONE" ? "border-emerald-100" : "border-slate-200"}`}
    >
      {/* Priority stripe */}
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${priorityCfg.dot}`} />

      <div className="pl-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            {/* Tags / project */}
            {showProject && task.project && (
              <Link href={`/projects/${task.project.id}`} className="inline-block mb-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors">
                  {task.project.name}
                </span>
              </Link>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {task.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    <Tag className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>
            )}
            <h4 className={`text-sm font-bold leading-snug ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-900"}`}>{task.title}</h4>
            {task.description && (
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* Options menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-7 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 text-sm">
                {onEdit && (
                  <button onClick={() => { onEdit(task); setShowMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Modifier
                  </button>
                )}
                <Link href={`/tasks/${task.id}`} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium" onClick={() => setShowMenu(false)}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> Détails
                </Link>
                {onDelete && (
                  <button onClick={() => { onDelete(task.id); setShowMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subtasks progress */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />Sous-tâches</span>
              <span>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${(task.subtasks.filter(s => s.done).length / task.subtasks.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Left: Status + due date */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCycleStatus}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border transition-all hover:brightness-95 ${statusCfg.color}`}
              title={`Changer le statut (actuellement: ${statusCfg.label})`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </button>

            {task.dueDate && (
              <span className={`text-[10px] font-bold flex items-center gap-1 ${overdue ? "text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100" : "text-slate-400"}`}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>

          {/* Right: Assignee avatar */}
          {task.assignee ? (
            <div title={task.assignee.name || task.assignee.email}>
              <UserAvatar
                user={task.assignee}
                size="xs"
                showStatus={false}
              />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
              <UserIcon className="w-3 h-3 text-slate-300" />
            </div>
          )}
        </div>
      </div>

      {/* Click-outside handler for menu */}
      {showMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
      )}
    </motion.div>
  );
}

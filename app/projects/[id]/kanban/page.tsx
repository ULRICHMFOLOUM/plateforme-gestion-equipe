"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LoadingScreen from "@/components/ui/LoadingScreen";
import {
  ArrowLeft, Plus, Search, Filter, LayoutGrid, List, Calendar,
  Clock, CheckCircle2, Circle, AlertTriangle, User, Tag, Paperclip,
  MessageSquare, Video, BarChart2, FileText, Users, Settings,
  Star, Archive, Trash2, Edit, X, ChevronRight, ChevronDown,
  CheckSquare, Zap, Timer, Image as ImageIcon, Flag, Layers,
  MoreHorizontal, GripVertical, Bookmark, Copy, Sparkles,
  AlarmClock, Play, Pause, RotateCcw, Milestone, GitBranch,
  Columns, BarChart, TrendingUp, Eye,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────
interface SubTask { id: string; text: string; done: boolean; }
interface CustomField { id: string; name: string; type: 'text' | 'number' | 'date' | 'select'; value: string; options?: string[]; }

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
  assignee?: { id: string; name: string; email: string; image?: string };
  tags: string[];
  subtasks: SubTask[];
  customFields: CustomField[];
  coverColor?: string;
  attachmentCount: number;
  commentCount: number;
  isArchived: boolean;
  timeSpentMinutes: number;
  estimatedMinutes?: number;
}

interface Column {
  id: "TODO" | "IN_PROGRESS" | "DONE";
  title: string;
  wipLimit?: number;
}

interface ButlerRule {
  id: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────
const COLUMNS: Column[] = [
  { id: "TODO", title: "À faire", wipLimit: 10 },
  { id: "IN_PROGRESS", title: "En cours", wipLimit: 5 },
  { id: "DONE", title: "Terminé" },
];

const PRIORITY_CFG = {
  LOW:    { label: "Basse",   dot: "bg-slate-400",   badge: "bg-slate-50 text-slate-600 border-slate-200",   icon: "▽" },
  MEDIUM: { label: "Moyenne", dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200",   icon: "◈" },
  HIGH:   { label: "Haute",   dot: "bg-red-400",     badge: "bg-red-50 text-red-700 border-red-200",         icon: "▲" },
};

const LABEL_COLORS = [
  { id: "red",    bg: "bg-red-400",    text: "text-white", label: "Urgent" },
  { id: "orange", bg: "bg-orange-400", text: "text-white", label: "Design" },
  { id: "yellow", bg: "bg-yellow-400", text: "text-white", label: "Review" },
  { id: "green",  bg: "bg-emerald-500",text: "text-white", label: "Dev" },
  { id: "blue",   bg: "bg-blue-500",   text: "text-white", label: "QA" },
  { id: "purple", bg: "bg-violet-500", text: "text-white", label: "Docs" },
];

const COVER_COLORS = [
  "bg-gradient-to-r from-pink-400 to-rose-500",
  "bg-gradient-to-r from-violet-500 to-purple-600",
  "bg-gradient-to-r from-blue-500 to-cyan-500",
  "bg-gradient-to-r from-emerald-400 to-teal-500",
  "bg-gradient-to-r from-amber-400 to-orange-500",
  "bg-gradient-to-r from-slate-700 to-slate-900",
];

const DEFAULT_BUTLER_RULES: ButlerRule[] = [
  { id: "1", trigger: "Quand une carte arrive dans « Terminé »", action: "Archiver automatiquement après 7 jours", enabled: false },
  { id: "2", trigger: "Quand une date d'échéance est dépassée", action: "Changer la priorité en HAUTE", enabled: false },
  { id: "3", trigger: "Quand une carte est créée dans « À faire »", action: "Notifier le responsable d'équipe", enabled: true },
];

// ─────────────────────────────────────────────────────────────────────
// Timer Hook
// ─────────────────────────────────────────────────────────────────────
function useTimer(initial = 0) {
  const [seconds, setSeconds] = useState(initial);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`;
  };

  return { seconds, running, start: () => setRunning(true), pause: () => setRunning(false), reset: () => { setRunning(false); setSeconds(0); }, fmt };
}

// ─────────────────────────────────────────────────────────────────────
// Card Detail Modal
// ─────────────────────────────────────────────────────────────────────
function CardDetailModal({ task, onClose, onUpdate, onArchive, onDelete }: {
  task: Task;
  onClose: () => void;
  onUpdate: (t: Task) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [newSubtask, setNewSubtask] = useState("");
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const timer = useTimer(task.timeSpentMinutes * 60);

  const subtasksDone = task.subtasks.filter(s => s.done).length;
  const subtasksTotal = task.subtasks.length;
  const subtaskProgress = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  const handleToggleSubtask = (sid: string) => {
    const updated = { ...task, subtasks: task.subtasks.map(s => s.id === sid ? { ...s, done: !s.done } : s) };
    onUpdate(updated);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const updated = { ...task, subtasks: [...task.subtasks, { id: Date.now().toString(), text: newSubtask, done: false }] };
    onUpdate(updated);
    setNewSubtask("");
  };

  const handleSetCover = (color: string) => {
    onUpdate({ ...task, coverColor: color });
    setShowCoverPicker(false);
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
          onClick={e => e.stopPropagation()}>

          {/* Cover */}
          {task.coverColor && (
            <div className={`h-32 w-full ${task.coverColor} relative`}>
              <button onClick={() => setShowCoverPicker(!showCoverPicker)}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all">
                <ImageIcon className="w-3.5 h-3.5" /> Changer la couverture
              </button>
              {showCoverPicker && (
                <div className="absolute bottom-12 right-3 bg-white rounded-2xl p-3 shadow-xl flex gap-2 z-10">
                  {COVER_COLORS.map((c, i) => (
                    <button key={i} onClick={() => handleSetCover(c)} className={`w-8 h-8 rounded-xl ${c} border-2 border-white hover:scale-110 transition-transform`} />
                  ))}
                  <button onClick={() => { onUpdate({ ...task, coverColor: undefined }); setShowCoverPicker(false); }}
                    className="w-8 h-8 rounded-xl bg-slate-100 border-2 border-slate-200 text-slate-500 flex items-center justify-center text-xs hover:scale-110 transition-transform">✕</button>
                </div>
              )}
            </div>
          )}
          {!task.coverColor && (
            <div className="pt-2 px-6 flex justify-end">
              <button onClick={() => setShowCoverPicker(!showCoverPicker)}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all">
                <ImageIcon className="w-3.5 h-3.5" /> Ajouter une couverture
              </button>
              {showCoverPicker && (
                <div className="absolute top-16 right-6 bg-white rounded-2xl p-3 shadow-xl flex gap-2 z-50">
                  {COVER_COLORS.map((c, i) => (
                    <button key={i} onClick={() => handleSetCover(c)} className={`w-8 h-8 rounded-xl ${c} border-2 border-white hover:scale-110 transition-transform`} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-7 overflow-y-auto flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                {editingTitle ? (
                  <input autoFocus value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={() => { setEditingTitle(false); onUpdate({ ...task, title }); }}
                    onKeyDown={e => e.key === "Enter" && setEditingTitle(false)}
                    className="text-2xl font-black text-slate-900 w-full bg-slate-50 border-2 border-blue-400 rounded-xl px-3 py-2 focus:outline-none" />
                ) : (
                  <h2 className="text-2xl font-black text-slate-900 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => setEditingTitle(true)}>
                    {title}
                  </h2>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${PRIORITY_CFG[task.priority].badge}`}>
                    {PRIORITY_CFG[task.priority].icon} {PRIORITY_CFG[task.priority].label}
                  </span>
                  {isOverdue && <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-black flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> En retard</span>}
                  {task.dueDate && <span className="text-xs text-slate-500 font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(task.dueDate).toLocaleDateString("fr-FR")}</span>}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all flex-shrink-0">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Edit className="w-3.5 h-3.5" /> Description</h3>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={() => onUpdate({ ...task, description })}
                placeholder="Ajouter une description plus détaillée..."
                className="w-full p-3 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white rounded-xl text-sm text-slate-700 font-medium resize-none focus:outline-none transition-all min-h-[100px]"
              />
            </div>

            {/* Labels */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Étiquettes colorées</h3>
              <div className="flex flex-wrap gap-2">
                {LABEL_COLORS.map(l => {
                  const active = task.tags.includes(l.id);
                  return (
                    <button key={l.id}
                      onClick={() => {
                        const newTags = active ? task.tags.filter(t => t !== l.id) : [...task.tags, l.id];
                        onUpdate({ ...task, tags: newTags });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${l.bg} ${l.text} ${active ? 'ring-2 ring-offset-2 ring-slate-400 scale-105' : 'opacity-50 hover:opacity-80'}`}>
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5" /> Checklist</h3>
                <span className="text-xs font-black text-slate-500">{subtasksDone}/{subtasksTotal}</span>
              </div>
              {subtasksTotal > 0 && (
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <motion.div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" animate={{ width: `${subtaskProgress}%` }} />
                </div>
              )}
              <div className="space-y-2 mb-3">
                {task.subtasks.map(st => (
                  <label key={st.id} className="flex items-center gap-3 group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <button onClick={() => handleToggleSubtask(st.id)}
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${st.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-blue-400"}`}>
                      {st.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`text-sm font-medium flex-1 ${st.done ? "line-through text-slate-400" : "text-slate-700"}`}>{st.text}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddSubtask()}
                  placeholder="Ajouter un élément..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-transparent focus:border-blue-400 focus:bg-white rounded-xl text-sm font-medium focus:outline-none transition-all" />
                <button onClick={handleAddSubtask} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Suivi du temps */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> Suivi du temps (Power-Up)</h3>
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
                <div className="text-2xl font-black text-slate-800 font-mono flex-1">{timer.fmt(timer.seconds)}</div>
                <div className="flex gap-2">
                  {!timer.running
                    ? <button onClick={timer.start} className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"><Play className="w-4 h-4" /></button>
                    : <button onClick={timer.pause} className="p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all"><Pause className="w-4 h-4" /></button>}
                  <button onClick={timer.reset} className="p-2.5 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all"><RotateCcw className="w-4 h-4" /></button>
                </div>
              </div>
              {task.estimatedMinutes && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Temps estimé: {Math.floor(task.estimatedMinutes / 60)}h{task.estimatedMinutes % 60}m</span>
                    <span>{Math.min(100, Math.round((timer.seconds / 60 / task.estimatedMinutes) * 100))}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-violet-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (timer.seconds / 60 / task.estimatedMinutes) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Champs personnalisés */}
            {task.customFields.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Champs personnalisés</h3>
                <div className="space-y-2">
                  {task.customFields.map(cf => (
                    <div key={cf.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      <span className="text-xs font-black text-slate-500 w-28 flex-shrink-0">{cf.name}</span>
                      <span className="text-sm font-semibold text-slate-800 flex-1">{cf.value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick info footer */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
              {task.assignee && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-black">
                    {task.assignee.name[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-600">{task.assignee.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold"><Paperclip className="w-3.5 h-3.5" /> {task.attachmentCount}</div>
              <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold"><MessageSquare className="w-3.5 h-3.5" /> {task.commentCount}</div>
            </div>

            {/* Danger zone */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button onClick={() => { onArchive(task.id); onClose(); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all">
                <Archive className="w-3.5 h-3.5" /> Archiver
              </button>
              <button onClick={() => { if (confirm("Supprimer cette tâche ?")) { onDelete(task.id); onClose(); } }}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Kanban Card
// ─────────────────────────────────────────────────────────────────────
function KanbanCard({ task, onClick, onDragStart, onArchive, onDelete, onUpdate }: {
  task: Task;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (t: Task) => void;
}) {
  const pcfg = PRIORITY_CFG[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
  const subtasksDone = task.subtasks.filter(s => s.done).length;
  const subtasksTotal = task.subtasks.length;
  const subtaskPct = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;
  const activeLabels = LABEL_COLORS.filter(l => task.tags.includes(l.id));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
    <div
      draggable
      onDragStart={onDragStart as any}
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-blue-500/8 transition-all cursor-pointer active:cursor-grabbing select-none overflow-hidden"
    >
      {/* Cover */}
      {task.coverColor && <div className={`h-14 w-full ${task.coverColor}`} />}

      {/* Label strips (Trello style) */}
      {activeLabels.length > 0 && (
        <div className="flex gap-1.5 px-4 pt-3 pb-0">
          {activeLabels.map(l => (
            <div key={l.id} className={`h-2 w-10 rounded-full ${l.bg}`} title={l.label} />
          ))}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Priority + overdue */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border ${pcfg.badge}`}>
            {pcfg.icon} {pcfg.label}
          </span>
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

        {/* Subtask progress */}
        {subtasksTotal > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3 text-blue-400" /> Checklist</span>
              <span>{subtasksDone}/{subtasksTotal}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${subtaskPct}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                <Clock className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </span>
            )}
            {task.attachmentCount > 0 && <span className="flex items-center gap-0.5 text-[10px] text-slate-400 font-semibold"><Paperclip className="w-3 h-3" />{task.attachmentCount}</span>}
            {task.commentCount > 0 && <span className="flex items-center gap-0.5 text-[10px] text-slate-400 font-semibold"><MessageSquare className="w-3 h-3" />{task.commentCount}</span>}
          </div>

          <div className="flex items-center gap-1">
            {task.assignee ? (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[9px] font-black border-2 border-white" title={task.assignee.name}>
                {task.assignee.name[0]}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                <User className="w-3 h-3 text-slate-400" />
              </div>
            )}

            {/* Quick actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={e => { e.stopPropagation(); onArchive(task.id); }} title="Archiver"
                className="p-1 hover:bg-amber-50 hover:text-amber-600 text-slate-400 rounded-lg transition-all">
                <Archive className="w-3 h-3" />
              </button>
              <button onClick={e => { e.stopPropagation(); if (confirm("Supprimer ?")) onDelete(task.id); }} title="Supprimer"
                className="p-1 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────
export default function KanbanPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState("Projet");
  const [projectRoomId, setProjectRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState("VIEWER");
  const [view, setView] = useState<"kanban" | "list" | "calendar">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const [butlerRules, setButlerRules] = useState<ButlerRule[]>(DEFAULT_BUTLER_RULES);
  const [showButler, setShowButler] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const draggedId = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    fetchData();
  }, [params.id, status]);

  const fetchData = async () => {
    try {
      const resp = await fetch(`/api/projects/${params.id}`);
      if (!resp.ok) return;
      const data = await resp.json();
      setProjectName(data.name || "Projet");
      setProjectRoomId(data.rooms?.[0]?.id || null);
      const member = data.members?.find((m: any) => m.user.id === session?.user?.id);
      setUserRole(member?.role || (data.owner?.id === session?.user?.id ? "OWNER" : "VIEWER"));

      const mapped: Task[] = (data.tasks || []).map((t: any): Task => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority || "MEDIUM",
        dueDate: t.dueDate,
        assignee: t.assignee || undefined,
        tags: t.tags ? t.tags.split(",").map((x: string) => x.trim()).filter(Boolean) : [],
        subtasks: [],
        customFields: [],
        coverColor: undefined,
        attachmentCount: 0,
        commentCount: 0,
        isArchived: false,
        timeSpentMinutes: 0,
        estimatedMinutes: undefined,
      }));
      setTasks(mapped);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch { fetchData(); }
  };

  const handleUpdateTask = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (selectedTask?.id === updated.id) setSelectedTask(updated);
  };

  const handleArchive = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isArchived: true } : t));
    showToast({ type: "info", title: "Carte archivée", message: "Accessible depuis l'historique." });
  };

  const handleDelete = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await fetch(`/api/tasks/${id}`, { method: "DELETE" }); } catch (e) { console.error(e); }
  };

  const runButlerAuto = () => {
    const count = tasks.filter(t => t.status === "DONE" && !t.isArchived).length;
    setTasks(prev => prev.map(t => t.status === "DONE" ? { ...t, isArchived: true } : t));
    showToast({ type: "success", title: "Butler exécuté !", message: `${count} carte(s) terminée(s) archivée(s).` });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    draggedId.current = taskId;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, colId: Task["status"]) => {
    e.preventDefault();
    setDraggingOver(null);
    const id = draggedId.current;
    if (!id) return;
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === colId) return;
    draggedId.current = null;
    await handleStatusChange(id, colId);
  };

  const allTags = Array.from(new Set(tasks.flatMap(t => t.tags)));
  const visibleTasks = tasks.filter(t => {
    if (!showArchived && t.isArchived) return false;
    const qs = searchQuery.toLowerCase();
    const matchQ = !qs || t.title.toLowerCase().includes(qs);
    const matchP = filterPriority === "all" || t.priority === filterPriority;
    const matchTag = filterTag === "all" || t.tags.includes(filterTag);
    return matchQ && matchP && matchTag;
  });

  const canEdit = userRole !== "VIEWER";

  if (status === "loading" || (status === "authenticated" && isLoading)) return <LoadingScreen />;
  if (status === "unauthenticated" || !session) return null;

  // ── Calendar View ──────────────────────────────────────────────────
  const renderCalendar = () => {
    const now = new Date();
    const year = now.getFullYear(), month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => null)
      .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">{now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h3>
        </div>
        <div className="grid grid-cols-7 text-center">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => (
            <div key={d} className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{d}</div>
          ))}
          {days.map((day, i) => {
            const dayTasks = day ? visibleTasks.filter(t => {
              if (!t.dueDate) return false;
              const d = new Date(t.dueDate);
              return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
            }) : [];
            return (
              <div key={i} className={`min-h-[90px] p-2 border-b border-r border-slate-100 ${!day ? "bg-slate-50/50" : "hover:bg-blue-50/30"} transition-colors`}>
                {day && (
                  <>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${day === now.getDate() ? "bg-blue-600 text-white" : "text-slate-700"}`}>{day}</div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map(t => (
                        <button key={t.id} onClick={() => setSelectedTask(t)}
                          className={`w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold truncate text-white transition-all hover:opacity-80 ${t.priority === "HIGH" ? "bg-red-500" : t.priority === "MEDIUM" ? "bg-blue-500" : "bg-slate-400"}`}>
                          {t.title}
                        </button>
                      ))}
                      {dayTasks.length > 3 && <div className="text-[9px] text-slate-500 font-bold pl-1">+{dayTasks.length - 3}</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── List View ──────────────────────────────────────────────────────
  const renderList = () => (
    <div className="space-y-3">
      {COLUMNS.map(col => {
        const colTasks = visibleTasks.filter(t => t.status === col.id);
        if (colTasks.length === 0) return null;
        return (
          <div key={col.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              {col.id === "TODO" && <Circle className="w-4 h-4 text-slate-400" />}
              {col.id === "IN_PROGRESS" && <Clock className="w-4 h-4 text-blue-500 animate-spin" style={{ animationDuration: "3s" }} />}
              {col.id === "DONE" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">{col.title}</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-black">{colTasks.length}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {colTasks.map(task => {
                const pcfg = PRIORITY_CFG[task.priority];
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
                return (
                  <motion.div key={task.id} layout
                    onClick={() => setSelectedTask(task)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-all group">
                    <div className={`w-2 h-8 rounded-full flex-shrink-0 ${task.priority === "HIGH" ? "bg-red-400" : task.priority === "MEDIUM" ? "bg-amber-400" : "bg-slate-300"}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate ${task.status === "DONE" ? "line-through text-slate-400" : ""}`}>{task.title}</h4>
                      {task.description && <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{task.description}</p>}
                    </div>
                    <span className={`hidden md:inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black border flex-shrink-0 ${pcfg.badge}`}>{pcfg.icon} {pcfg.label}</span>
                    {task.dueDate && <span className={`hidden lg:flex items-center gap-1 text-[10px] font-semibold flex-shrink-0 ${isOverdue ? "text-red-500" : "text-slate-400"}`}><Clock className="w-3 h-3" />{new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>}
                    {task.subtasks.length > 0 && (
                      <div className="hidden xl:flex items-center gap-2 flex-shrink-0 w-24">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(task.subtasks.filter(s => s.done).length / task.subtasks.length) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>
                      </div>
                    )}
                    {task.assignee && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">{task.assignee.name[0]}</div>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Kanban View ────────────────────────────────────────────────────
  const renderKanban = () => (
    <div className="flex gap-5 overflow-x-auto pb-6">
      {COLUMNS.map(col => {
        const colTasks = visibleTasks.filter(t => t.status === col.id);
        const isOver = draggingOver === col.id;
        const isWipExceeded = col.wipLimit && colTasks.length > col.wipLimit;

        return (
          <div key={col.id} className="flex-shrink-0 w-80 flex flex-col"
            onDragOver={e => { e.preventDefault(); setDraggingOver(col.id); }}
            onDrop={e => handleDrop(e, col.id)}
            onDragLeave={() => setDraggingOver(null)}>

            {/* Column Header */}
            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl mb-3 border-2 transition-all ${isOver ? "border-blue-300 bg-blue-50 shadow-lg" : "border-transparent bg-white/70"}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-8 rounded-full flex-shrink-0 ${col.id === "TODO" ? "bg-slate-400" : col.id === "IN_PROGRESS" ? "bg-blue-500" : "bg-emerald-500"}`} />
                {col.id === "TODO" && <Circle className="w-4 h-4 text-slate-500" />}
                {col.id === "IN_PROGRESS" && <Clock className="w-4 h-4 text-blue-600" />}
                {col.id === "DONE" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                <span className={`text-sm font-black uppercase tracking-wider ${col.id === "TODO" ? "text-slate-600" : col.id === "IN_PROGRESS" ? "text-blue-700" : "text-emerald-700"}`}>{col.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${isWipExceeded ? "bg-red-100 text-red-600 border border-red-200" : "bg-slate-100 text-slate-600"}`}>
                  {colTasks.length}{col.wipLimit ? `/${col.wipLimit}` : ""}
                </span>
              </div>
              {canEdit && (
                <Link href={`/projects/${params.id}/tasks/new?status=${col.id}`}>
                  <button className="p-1.5 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </Link>
              )}
            </div>

            {/* Cards */}
            <div className={`flex-1 min-h-[300px] rounded-2xl p-2 space-y-3 transition-all duration-200 ${isOver ? "bg-blue-50/50 border-2 border-dashed border-blue-300" : "bg-slate-50/30 border-2 border-transparent"}`}>
              <AnimatePresence mode="popLayout">
                {colTasks.map(task => (
                  <KanbanCard key={task.id} task={task}
                    onClick={() => setSelectedTask(task)}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onUpdate={handleUpdateTask}
                  />
                ))}
              </AnimatePresence>

              {colTasks.length === 0 && !isOver && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  {col.id === "TODO" && <Circle className="w-8 h-8 text-slate-200 mb-2" />}
                  {col.id === "IN_PROGRESS" && <Clock className="w-8 h-8 text-blue-200 mb-2" />}
                  {col.id === "DONE" && <CheckCircle2 className="w-8 h-8 text-emerald-200 mb-2" />}
                  <p className="text-xs font-bold text-slate-400">Déposez une carte ici</p>
                </div>
              )}

              {canEdit && (
                <Link href={`/projects/${params.id}/tasks/new?status=${col.id}`}>
                  <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all text-xs font-bold flex items-center justify-center gap-1.5">
                    <Plus className="w-4 h-4" /> Ajouter une carte
                  </button>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-violet-50/30 p-6">
      <div className="max-w-[1800px] mx-auto space-y-5">

        {/* ── Header ───────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <Link href={`/projects/${params.id}`}>
              <button className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-xs font-black uppercase tracking-widest transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {projectName}
              </button>
            </Link>
            <span className="text-slate-200">/</span>
            <span className="text-xs font-black uppercase tracking-widest text-blue-600">Kanban</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Tableau Kanban</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {visibleTasks.filter(t => !t.isArchived).length} tâches actives · {tasks.filter(t => t.isArchived).length} archivées
              </p>
            </div>

            {/* Shortcut bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {projectRoomId && (
                <Link href={`/chat?room=${projectRoomId}`}>
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                    <MessageSquare className="w-4 h-4" /> Chat
                  </button>
                </Link>
              )}
              <Link href="/video">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                  <Video className="w-4 h-4" /> Visio
                </button>
              </Link>
              <Link href={`/reports?projectId=${params.id}`}>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                  <BarChart2 className="w-4 h-4" /> Rapports
                </button>
              </Link>
              <Link href={`/files?projectId=${params.id}`}>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                  <Paperclip className="w-4 h-4" /> Fichiers
                </button>
              </Link>
              <Link href={`/projects/${params.id}/members`}>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-sm">
                  <Users className="w-4 h-4" /> Membres
                </button>
              </Link>
              {canEdit && (
                <Link href={`/projects/${params.id}/tasks/new`}>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5">
                    <Plus className="w-4 h-4" /> Nouvelle tâche
                  </button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Power-Ups & Toolbar ───────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">

          {/* View switcher + search + filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Views */}
            <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1">
              {[
                { v: "kanban" as const, icon: Columns, label: "Kanban" },
                { v: "list" as const, icon: List, label: "Liste" },
                { v: "calendar" as const, icon: Calendar, label: "Calendrier" },
              ].map(({ v, icon: Icon, label }) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${view === v ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher une tâche..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-400 focus:bg-white transition-all" />
            </div>

            {/* Priority filter */}
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-2xl text-[11px] font-black uppercase tracking-wider text-slate-600 focus:outline-none focus:border-blue-400">
              <option value="all">Toutes priorités</option>
              <option value="HIGH">Haute</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="LOW">Basse</option>
            </select>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-2xl text-[11px] font-black uppercase tracking-wider text-slate-600 focus:outline-none focus:border-blue-400">
                <option value="all">Toutes étiquettes</option>
                {LABEL_COLORS.filter(l => allTags.includes(l.id)).map(l => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            )}

            {/* Archive toggle */}
            <button onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${showArchived ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-500 border-transparent"}`}>
              <Eye className="w-3.5 h-3.5" /> Archivées
            </button>
          </div>

          {/* Power-Ups Bar */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Power-Ups :
            </span>

            {/* Butler automations */}
            <button onClick={() => setShowButler(!showButler)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all ${showButler ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-200 hover:text-violet-600"}`}>
              <Zap className="w-3.5 h-3.5" /> Automatisations Butler
            </button>

            {/* Run butler now */}
            <button onClick={runButlerAuto}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[11px] font-black hover:bg-amber-100 transition-all">
              <Sparkles className="w-3.5 h-3.5" /> Archiver les terminées
            </button>

            {/* Duplicate board (template) */}
            <button onClick={() => showToast({ type: "info", title: "Modèle de tableau", message: "Fonctionnalité bientôt disponible !" })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[11px] font-black hover:border-slate-300 transition-all">
              <Copy className="w-3.5 h-3.5" /> Dupliquer en modèle
            </button>
          </div>

          {/* Butler Panel */}
          <AnimatePresence>
            {showButler && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="pt-3 border-t border-slate-100 overflow-hidden">
                <h4 className="text-xs font-black uppercase tracking-widest text-violet-600 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Règles d'automatisation Butler
                </h4>
                <div className="space-y-2">
                  {butlerRules.map(rule => (
                    <div key={rule.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl">
                      <button
                        onClick={() => setButlerRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                        className={`w-10 h-5 rounded-full transition-all flex-shrink-0 relative ${rule.enabled ? "bg-violet-500" : "bg-slate-300"}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${rule.enabled ? "left-5" : "left-0.5"}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate">{rule.trigger}</div>
                        <div className="text-xs text-slate-400 font-medium">→ {rule.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Board Content ────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {view === "kanban" && renderKanban()}
          {view === "list" && renderList()}
          {view === "calendar" && renderCalendar()}
        </motion.div>

      </div>

      {/* ── Card Detail Modal ─────────────────────────────────────── */}
      {selectedTask && (
        <CardDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

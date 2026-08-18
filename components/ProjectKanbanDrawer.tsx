"use client";

import { useState, useEffect } from "react";
import ContextDrawer from "./ui/ContextDrawer";
import { Kanban, Plus, CheckCircle2, Clock, Circle, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
}

interface ProjectKanbanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  tasks: Task[];
  onTaskStatusChange?: (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => void;
  onTaskCreated?: () => void;
}

export default function ProjectKanbanDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
  tasks: initialTasks,
  onTaskStatusChange,
  onTaskCreated,
}: ProjectKanbanDrawerProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleMoveStatus = async (taskId: string, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (onTaskStatusChange) onTaskStatusChange(taskId, newStatus);
    } catch (e) {
      console.error("Error updating task status:", e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          projectId,
          status: "TODO",
          priority: "MEDIUM",
        }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        setNewTitle("");
        if (onTaskCreated) onTaskCreated();
      }
    } catch (err) {
      console.error("Error creating task:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const todoTasks = tasks.filter((t) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Tableau Kanban — ${projectName}`}
      width="w-full sm:w-[600px] lg:w-[850px]"
    >
      <div className="p-6 space-y-6">
        {/* Quick add bar & Fullscreen link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <form onSubmit={handleCreateTask} className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <input
              type="text"
              placeholder="Ajouter une tâche rapide..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isCreating || !newTitle.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </form>

          <Link
            href={`/projects/${projectId}/kanban`}
            onClick={onClose}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0"
          >
            Plein écran <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Columns Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: TODO */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <span className="font-black text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Circle className="w-3.5 h-3.5 text-slate-400" /> À faire ({todoTasks.length})
              </span>
            </div>
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
              {todoTasks.map((t) => (
                <div key={t.id} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
                  <p className="font-bold text-slate-800 text-sm mb-2">{t.title}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">À FAIRE</span>
                    <button
                      onClick={() => handleMoveStatus(t.id, "IN_PROGRESS")}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      Avancer ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: IN_PROGRESS */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200/60">
              <span className="font-black text-xs text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> En cours ({inProgressTasks.length})
              </span>
            </div>
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
              {inProgressTasks.map((t) => (
                <div key={t.id} className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs hover:shadow-md transition-all">
                  <p className="font-bold text-slate-800 text-sm mb-2">{t.title}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <button
                      onClick={() => handleMoveStatus(t.id, "TODO")}
                      className="text-slate-500 font-bold hover:underline"
                    >
                      ⬅ Reculer
                    </button>
                    <button
                      onClick={() => handleMoveStatus(t.id, "DONE")}
                      className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
                    >
                      Terminer ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: DONE */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-200/60">
              <span className="font-black text-xs text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Terminé ({doneTasks.length})
              </span>
            </div>
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
              {doneTasks.map((t) => (
                <div key={t.id} className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs hover:shadow-md transition-all opacity-85">
                  <p className="font-bold text-slate-800 text-sm line-through mb-2">{t.title}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold">TERMINÉ</span>
                    <button
                      onClick={() => handleMoveStatus(t.id, "IN_PROGRESS")}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Rouvrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ContextDrawer>
  );
}

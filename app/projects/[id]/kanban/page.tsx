"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  User,
  Calendar,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  Filter,
  Search,
  Grid3x3,
  List as ListIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

// Types
interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignee?: { id: string; name: string; email: string };
  dueDate?: Date;
  tags: string[];
}

interface Column {
  id: "TODO" | "IN_PROGRESS" | "DONE";
  title: string;
  color: string;
  tasks: Task[];
  limit?: number;
}

export default function KanbanPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  
  const [columns, setColumns] = useState<Column[]>([
    { id: "TODO", title: "À faire", color: "slate", tasks: [] },
    { id: "IN_PROGRESS", title: "En cours", color: "blue", tasks: [] },
    { id: "DONE", title: "Terminé", color: "green", tasks: [] },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [userRole, setUserRole] = useState<string>("VIEWER");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    fetchProjectTasks();
  }, [params.id, status, session]);

  const fetchProjectTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Distribute tasks into columns based on their status
        const rawTasks = data.tasks || [];
        
        const todoTasks = rawTasks.filter((t: any) => t.status === "TODO").map(mapApiTask);
        const inProgressTasks = rawTasks.filter((t: any) => t.status === "IN_PROGRESS").map(mapApiTask);
        const doneTasks = rawTasks.filter((t: any) => t.status === "DONE").map(mapApiTask);

        setColumns([
          { id: "TODO", title: "À faire", color: "slate", tasks: todoTasks },
          { id: "IN_PROGRESS", title: "En cours", color: "blue", tasks: inProgressTasks },
          { id: "DONE", title: "Terminé", color: "green", tasks: doneTasks },
        ]);

        // Determine user role
        const member = data.members.find((m: any) => m.user.id === session?.user?.id);
        if (member) {
          setUserRole(member.role);
        } else if (data.owner.id === session?.user?.id) {
          setUserRole("OWNER");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des tâches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const mapApiTask = (t: any): Task => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, email: t.assignee.email } : undefined,
    dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
    tags: t.tags ? t.tags.split(",").map((tag: string) => tag.trim()) : [],
  });

  const priorityConfig = {
    LOW: { label: "Basse", color: "text-slate-600", bg: "bg-slate-100", dot: "bg-slate-500" },
    MEDIUM: { label: "Moyenne", color: "text-blue-600", bg: "bg-blue-100", dot: "bg-blue-500" },
    HIGH: { label: "Haute", color: "text-red-600", bg: "bg-red-100", dot: "bg-red-500" },
  };

  const columnColorConfig = {
    slate: { bg: "bg-slate-100", border: "border-slate-300", text: "text-slate-700" },
    blue: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700" },
    orange: { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-700" },
    green: { bg: "bg-green-100", border: "border-green-300", text: "text-green-700" },
  };

  const handleDragStart = (task: Task, columnId: string) => {
    if (userRole === "VIEWER") return;
    setDraggedTask({ task, columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetColumnId: string) => {
    if (!draggedTask || userRole === "VIEWER") return;
    
    // Prevent dropping in the same column
    if (draggedTask.columnId === targetColumnId) {
      setDraggedTask(null);
      return;
    }

    const sourceColumn = columns.find((col) => col.id === draggedTask.columnId);
    const targetColumn = columns.find((col) => col.id === targetColumnId);

    if (!sourceColumn || !targetColumn) return;

    // Optimistically update UI
    const updatedTask = { ...draggedTask.task, status: targetColumnId as Task["status"] };
    
    const updatedColumns = columns.map((col) => {
      if (col.id === draggedTask.columnId) {
        return {
          ...col,
          tasks: col.tasks.filter((t) => t.id !== draggedTask.task.id),
        };
      }
      if (col.id === targetColumnId) {
        return {
          ...col,
          tasks: [...col.tasks, updatedTask],
        };
      }
      return col;
    });

    setColumns(updatedColumns);
    draggedTask.task.status = targetColumnId as Task["status"];

    // Call API to persist changes
    try {
      const resp = await fetch(`/api/tasks/${updatedTask.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetColumnId }),
      });
      
      if (!resp.ok) {
        throw new Error("Failed to update task status");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      fetchProjectTasks(); 
    }
    setDraggedTask(null);
  };

  const isOverdue = (date?: Date) => {
    if (!date) return false;
    return date < new Date();
  };

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    }),
  }));

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/projects/${params.id}`}>
              <Button variant="outline" icon={ArrowLeft}>
                Retour au projet
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">
                Tableau Kanban
              </h1>
              <p className="text-lg text-slate-600">
                Gérez vos tâches par drag & drop
              </p>
            </div>

            {(userRole === "ADMIN" || userRole === "OWNER" || userRole === "MANAGER") && (
              <Link href={`/projects/${params.id}/tasks/new`}>
                <Button variant="primary" icon={Plus}>
                  Nouvelle tâche
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-slate-200"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
            >
              <option value="all">Toutes priorités</option>
              <option value="HIGH">Haute</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="LOW">Basse</option>
            </select>

            <Button variant="outline" icon={Filter}>
              Filtres
            </Button>
          </div>
        </motion.div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredColumns.map((column, colIndex) => {
            const colorConfig = columnColorConfig[column.color as keyof typeof columnColorConfig];

            return (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + colIndex * 0.1 }}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
                className="flex flex-col"
              >
                {/* Column Header */}
                <div className={`rounded-t-2xl p-4 border-2 ${colorConfig.border} ${colorConfig.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-display font-bold text-lg ${colorConfig.text}`}>
                      {column.title}
                    </h3>
                    <button className="p-1 hover:bg-white/50 rounded transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${colorConfig.text}`}>
                      {column.tasks.length} tâche{column.tasks.length > 1 ? "s" : ""}
                    </span>
                    {column.limit && (
                      <span className={`text-sm font-medium ${colorConfig.text}`}>
                        Limite: {column.limit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-b-2xl border-2 border-t-0 border-slate-200 p-3 space-y-3 min-h-[400px]">
                  {column.tasks.map((task, taskIndex) => {
                    const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: taskIndex * 0.05 }}
                        draggable
                        onDragStart={() => handleDragStart(task, column.id)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-move group"
                      >
                        {/* Priority & Actions */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`flex items-center gap-1.5 px-2 py-1 ${priority.bg} rounded-lg text-xs font-semibold ${priority.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                            {priority.label}
                          </span>
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded transition-all">
                            <MoreVertical className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                          {task.title}
                        </h4>

                        {/* Description */}
                        {task.description && (
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1.5 mb-3 flex-wrap">
                            {task.tags.map((tag, i) => (
                               <span
                                 key={i}
                                 className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium"
                               >
                                 {tag}
                               </span>
                            ))}
                          </div>
                        )}

                        {/* Due Date */}
                        {task.dueDate && (
                          <div className={`flex items-center gap-1 text-xs mb-3 ${
                            isOverdue(task.dueDate) ? "text-red-600" : "text-slate-600"
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {isOverdue(task.dueDate) ? "En retard • " : ""}
                              {task.dueDate.toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        )}

                        {/* Footer (Assignee) */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                           <div className="flex items-center gap-2">
                             {task.assignee ? (
                               <div
                                 className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold"
                                 title={task.assignee.name || task.assignee.email}
                                >
                                 {(task.assignee.name || task.assignee.email).substring(0, 2).toUpperCase()}
                               </div>
                             ) : (
                               <div className="w-6 h-6 rounded-full bg-slate-200 border-dashed border-2 border-slate-400 flex items-center justify-center">
                                 <User className="w-3 h-3 text-slate-500" />
                               </div>
                             )}
                           </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {(userRole === "ADMIN" || userRole === "OWNER" || userRole === "MANAGER") && (
                    <Link href={`/projects/${params.id}/tasks/new`}>
                      <button className="w-full mt-2 p-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-slate-600 hover:text-blue-600 font-medium">
                        <Plus className="w-5 h-5 mx-auto" />
                      </button>
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

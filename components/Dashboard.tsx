"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  CheckSquare,
  FolderOpen,
  Users,
  MessageSquare,
  FileText,
  Video,
  BarChart3,
  ArrowRight,
  User,
  BookOpen,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Card, StatCard, ActionCard } from "./ui/Card";
import { SectionTransition } from "./PageTransition";
import UserAvatar from "./ui/UserAvatar";
import { useSearch } from "@/context/SearchContext";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project?: { name: string };
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
}

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  events: Event[];
  stats?: {
    summary: {
      projects: number;
      avgProgress: number;
      taskCompletionRate: number;
      budget: {
        total: number;
        spent: number;
        utilization: number;
      };
    };
    upcomingEvents: any[];
    urgentTasks: any[];
  };
}

export default function Dashboard({ tasks, projects, events, stats: initialStats }: DashboardProps) {
  const { data: session } = useSession();
  const [dashboardStats, setDashboardStats] = useState<any>(initialStats || null);
  const [loading, setLoading] = useState(!initialStats);
  const { searchQuery } = useSearch();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const data = await response.json();
          setDashboardStats(data);
        }
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!initialStats) {
      fetchStats();
    }
  }, [initialStats]);

  const quickActions = [
    { name: "Profil", href: "/profile", icon: User, description: "Gérez votre profil" },
    { name: "Annuaire", href: "/directory", icon: BookOpen, description: "Consultez l'annuaire" },
    { name: "Messagerie", href: "/chat", icon: MessageSquare, description: "Communiquez avec votre équipe" },
    { name: "Fichiers", href: "/files", icon: FileText, description: "Gérez vos documents" },
    { name: "Visioconférence", href: "/video", icon: Video, description: "Organisez des réunions virtuelles" },
    { name: "Rapports", href: "/reports", icon: BarChart3, description: "Analysez vos performances" },
  ];

  const getActionColor = (name: string): "blue" | "green" | "purple" | "orange" | "red" => {
    switch (name) {
      case "Profil": return "blue";
      case "Annuaire": return "green";
      case "Messagerie": return "purple";
      case "Fichiers": return "orange";
      case "Visioconférence": return "red";
      case "Rapports": return "purple";
      default: return "blue";
    }
  };

  // --- Filtered data based on search query ---
  const q = searchQuery.toLowerCase().trim();

  const filteredTasks = useMemo(() =>
    q.length < 2
      ? tasks
      : tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.project?.name?.toLowerCase().includes(q) ||
            t.status.toLowerCase().includes(q) ||
            t.priority.toLowerCase().includes(q)
        ),
    [tasks, q]
  );

  const filteredEvents = useMemo(() =>
    q.length < 2
      ? events
      : events.filter((e) => e.title.toLowerCase().includes(q)),
    [events, q]
  );

  const filteredActions = useMemo(() =>
    q.length < 2
      ? quickActions
      : quickActions.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q)
        ),
    [q]
  );

  const isFiltering = q.length >= 2;
  const hasNoResults = isFiltering && filteredTasks.length === 0 && filteredEvents.length === 0 && filteredActions.length === 0;

  return (
    <div className="relative">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-400/10 blur-[120px] rounded-full pointer-events-none" />

      <SectionTransition>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">
              Tableau de bord
            </h1>
            <p className="text-slate-500 mt-1">
              {isFiltering ? (
                <span>
                  Résultats pour{" "}
                  <span className="text-blue-600 font-semibold">"{searchQuery}"</span>
                </span>
              ) : (
                <>
                  Ravi de vous revoir,{" "}
                  <span className="text-blue-600 font-semibold">
                    {session?.user?.name?.split(" ")[0]}
                  </span>{" "}
                  ! 👋
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
            <UserAvatar
              src={session?.user?.image}
              name={session?.user?.name || session?.user?.email}
              size="sm"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">{session?.user?.name || "Utilisateur"}</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Session Active</p>
            </div>
          </div>
        </div>
      </SectionTransition>

      {/* No results state */}
      <AnimatePresence>
        {hasNoResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-xl font-bold text-slate-700 mb-1">Aucun résultat</p>
            <p className="text-slate-500">Aucun élément ne correspond à "{searchQuery}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats cards — always visible */}
      {!isFiltering && (
        <SectionTransition delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={CheckSquare}
              label="Tâches actives"
              value={tasks.length}
              color="blue"
              onClick={() => (window.location.href = "/tasks")}
            />
            <StatCard
              icon={FolderOpen}
              label="Projets"
              value={dashboardStats?.summary?.projects ?? projects.length}
              color="green"
              onClick={() => (window.location.href = "/projects")}
            />
            <StatCard
              icon={BarChart3}
              label="Progression Moy."
              value={`${dashboardStats?.summary?.avgProgress ?? 0}%`}
              color="purple"
              onClick={() => (window.location.href = "/reports")}
            />
            <StatCard
              icon={Users}
              label="Taux Complétion"
              value={`${dashboardStats?.summary?.taskCompletionRate ?? 0}%`}
              color="orange"
              onClick={() => (window.location.href = "/tasks")}
            />
          </div>
        </SectionTransition>
      )}

      <SectionTransition delay={0.2}>
        {/* Quick Actions */}
        {filteredActions.length > 0 && (
          <div className="mb-8">
            {isFiltering && (
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Actions rapides
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <ActionCard
                    icon={action.icon}
                    title={action.name}
                    description={action.description}
                    color={getActionColor(action.name)}
                    onClick={() => {}}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tasks & Events */}
        {(!isFiltering || filteredTasks.length > 0 || filteredEvents.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tasks */}
            {(!isFiltering || filteredTasks.length > 0) && (
              <Card title="Tâches récentes" icon={CheckSquare} iconColor="from-blue-500 to-cyan-500">
                {isFiltering && (
                  <p className="text-xs text-slate-400 mb-3">
                    {filteredTasks.length} résultat{filteredTasks.length > 1 ? "s" : ""}
                  </p>
                )}
                <div className="space-y-4">
                  {filteredTasks.slice(0, 5).map((task) => (
                    <motion.div
                      key={task.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-10 rounded-full ${
                            task.status === "DONE"
                              ? "bg-green-500"
                              : task.status === "IN_PROGRESS"
                              ? "bg-blue-500"
                              : "bg-slate-300"
                          }`}
                        />
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase">
                            {task.title}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            {task.project?.name} •{" "}
                            <span className="uppercase font-semibold text-[10px] tracking-wider">
                              {task.priority}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="p-2 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                      >
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                      </Link>
                    </motion.div>
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      Aucune tâche correspondante
                    </div>
                  )}
                </div>
                <Link
                  href="/tasks"
                  className="mt-6 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm bg-blue-50 py-3 rounded-xl transition-colors"
                >
                  Voir toutes les tâches
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
            )}

            {/* Events */}
            {(!isFiltering || filteredEvents.length > 0) && (
              <Card title="Événements à venir" icon={Calendar} iconColor="from-purple-500 to-pink-500">
                {isFiltering && (
                  <p className="text-xs text-slate-400 mb-3">
                    {filteredEvents.length} résultat{filteredEvents.length > 1 ? "s" : ""}
                  </p>
                )}
                <div className="space-y-4">
                  {filteredEvents.slice(0, 5).map((event) => (
                    <motion.div
                      key={event.id}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-purple-100 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl flex items-center justify-center border border-purple-100">
                          <Calendar className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors uppercase">
                            {event.title}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(event.startDate).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/calendar"
                        className="p-2 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                      >
                        <ArrowRight className="w-4 h-4 text-purple-500" />
                      </Link>
                    </motion.div>
                  ))}
                  {filteredEvents.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      Aucun événement correspondant
                    </div>
                  )}
                </div>
                <Link
                  href="/calendar"
                  className="mt-6 flex items-center justify-center gap-2 text-purple-600 hover:text-purple-700 font-bold text-sm bg-purple-50 py-3 rounded-xl transition-colors"
                >
                  Voir le calendrier
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
            )}
          </div>
        )}
      </SectionTransition>
    </div>
  );
}

"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/ui/LoadingScreen";
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  Users,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Send,
  FileText,
  Download,
  Share2,
  Eye,
  Smile,
  Pin,
  Heart,
  ThumbsUp,
  Trash2,
  Flag,
  BarChart3,
  Activity,
  Settings,
  Plus,
  Video,
  Calendar as CalendarIcon,
  Image as ImageIcon,
} from "lucide-react";
import { Card, StatCard, ActionCard } from "@/components/ui/Card";
import ProjectChatDrawer from "@/components/ProjectChatDrawer";
import ProjectFilesDrawer from "@/components/ProjectFilesDrawer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "in_progress" | "on_hold" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  progress: number;
  startDate: Date | null;
  endDate: Date | null;
  budget: number | null;
  spent: number | null;
  color: string;
  owner: Member;
  members: Member[];
  tags: string[];
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
}

interface Comment {
  id: string;
  author: { id: string; name: string; avatar?: string; role?: string; email?: string };
  content: string;
  projectId: string;
  createdAt: string | Date;
}

export default function ProjectDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "comments" | "activity" | "reports" | "events">("overview");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [projectRoomId, setProjectRoomId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [projectEvents, setProjectEvents] = useState<any[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    if (params.id) {
      fetchProject();
      fetchProjectEvents();
    }
  }, [params.id, status, session]);

  const fetchProjectEvents = async () => {
    setIsEventsLoading(true);
    try {
      const resp = await fetch(`/api/events?projectId=${params.id}`);
      if (resp.ok) {
        setProjectEvents(await resp.json());
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        
        // Transform API data to Project format
        const transformedProject: Project = {
          id: data.id,
          name: data.name,
          description: data.description || "",
          status: mapStatus(data.status),
          priority: (data.priority || "MEDIUM").toLowerCase() as Project["priority"],
          progress: data.progress || 0,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          spent: data.spent,
          color: data.color || "blue",
          owner: {
            id: data.owner.id,
            name: data.owner.name || data.owner.email,
            avatar: data.owner.name 
              ? data.owner.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
              : data.owner.email.substring(0, 2).toUpperCase(),
            role: "Chef de Projet",
          },
          members: data.members.map((m: any) => ({
            id: m.user.id,
            name: m.user.name || m.user.email,
            avatar: m.user.name
              ? m.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
              : m.user.email.substring(0, 2).toUpperCase(),
            role: m.role || "Membre",
          })),
          tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [],
        };
        
        setProject(transformedProject);
        setTasks(data.tasks || []);
        setProjectRoomId(data.rooms?.[0]?.id || null);
        fetchComments();
        fetchActivities();
      }
    } catch (error) {
      console.error("Erreur lors du chargement du projet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const resp = await fetch(`/api/projects/${params.id}/comments`);
      if (resp.ok) {
        const data = await resp.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires", error);
    }
  };
  const fetchActivities = async () => {
    try {
      const resp = await fetch(`/api/projects/${params.id}/activity`);
      if (resp.ok) {
        setActivities(await resp.json());
      }
    } catch (error) {
      console.error("Erreur activités:", error);
    }
  };

  const mapStatus = (status: string): Project["status"] => {
    const statusMap: Record<string, Project["status"]> = {
      ACTIVE: "in_progress",
      COMPLETED: "completed",
      ARCHIVED: "on_hold",
    };
    return statusMap[status] || "planning";
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !project) return;

    try {
      const resp = await fetch(`/api/projects/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (resp.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Erreur d'ajout de commentaire:", error);
    }
  };

  const handleReaction = (commentId: string, emoji: string) => {
     // TODO: Implement actual reaction saving
  };

  const handleGenerateReport = async () => {
    if (!project) return;
    setIsGeneratingReport(true);
    setShowReportModal(true);
    try {
      const resp = await fetch(`/api/projects/${params.id}/report`);
      if (resp.ok) {
        setReportData(await resp.json());
      }
    } catch (error) {
      console.error("Erreur génération rapport:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Projet non trouvé
          </h1>
          <p className="text-gray-600 mb-4">
            Le projet que vous recherchez n'existe pas.
          </p>
          <Link href="/projects" className="text-blue-600 hover:text-blue-500">
            Retour aux projets
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = {
    planning: { label: "Planification", color: "bg-slate-500" },
    in_progress: { label: "En cours", color: "bg-blue-500" },
    on_hold: { label: "En pause", color: "bg-orange-500" },
    completed: { label: "Terminé", color: "bg-green-500" },
  };

  const currentUserId = session.user.id;
  const isOwner = project.owner.id === currentUserId;
  const memberMe = project.members.find(m => m.id === currentUserId);
  const isProjectAdmin = isOwner || memberMe?.role === 'ADMIN' || memberMe?.role === 'OWNER' || memberMe?.role === 'MANAGER';

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();

    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)}j`;
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const taskStats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "DONE").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    todo: tasks.filter((t) => t.status === "TODO").length,
  };

  const tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: Eye },
    { id: "comments", label: "Commentaires", icon: MessageSquare, badge: comments.length },
    { id: "activity", label: "Activité", icon: Activity },
    { id: "reports", label: "Rapports", icon: FileText },
    { id: "events", label: "Événements", icon: CalendarIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link href="/projects">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-5 h-5" />
                Retour
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <Target className="w-8 h-8 text-white" />
                </div>

                <div className="flex-1">
                  <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">
                    {project.name}
                  </h1>
                  <p className="text-lg text-slate-600 mb-4">{project.description}</p>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-4 py-1.5 ${statusConfig[project.status].color} text-white rounded-full text-sm font-semibold`}>
                      {statusConfig[project.status].label}
                    </span>

                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {isProjectAdmin && (
                <>
                  <Button variant="outline" className="gap-2">
                    <Edit className="w-4 h-4" />
                    Modifier
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </Button>
                  <Button variant="ghost" className="p-2">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            icon={TrendingUp}
            label="Progression"
            value={`${project.progress}%`}
            color="blue"
          />
          <StatCard
            icon={CheckCircle2}
            label="Tâches terminées"
            value={`${taskStats.done}/${taskStats.total}`}
            trend={{ value: 12, isPositive: true }}
            color="green"
          />
          <StatCard
            icon={Users}
            label="Membres d'équipe"
            value={project.members.length.toString()}
            color="orange"
          />
          <StatCard
            icon={DollarSign}
            label="Budget utilisé"
            value={project.budget ? `${Math.round(((project.spent || 0) / project.budget) * 100)}%` : "N/A"}
            color="purple"
          />
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${activeTab === tab.id ? "bg-white/20" : "bg-slate-100"}
                  `}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-3 gap-6"
            >
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Progress */}
                <Card>
                  <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
                    Progression du projet
                  </h3>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Avancement global
                      </span>
                      <span className="text-2xl font-bold text-slate-900">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-3xl font-bold text-green-600">{taskStats.done}</p>
                      <p className="text-sm text-slate-600">Terminées</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <p className="text-3xl font-bold text-blue-600">{taskStats.inProgress}</p>
                      <p className="text-sm text-slate-600">En cours</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl">
                      <p className="text-3xl font-bold text-slate-600">{taskStats.todo}</p>
                      <p className="text-sm text-slate-600">À faire</p>
                    </div>
                  </div>
                </Card>

                {/* Budget */}
                {project.budget && (
                  <Card>
                    <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
                      Budget et dépenses
                    </h3>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Budget total</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {project.budget.toLocaleString("fr-FR")} €
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Dépensé</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {(project.spent || 0).toLocaleString("fr-FR")} €
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Utilisation du budget
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {Math.round(((project.spent || 0) / project.budget) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          style={{ width: `${((project.spent || 0) / project.budget) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-slate-600 mt-2">
                        Restant : {(project.budget - (project.spent || 0)).toLocaleString("fr-FR")} €
                      </p>
                    </div>
                  </Card>
                )}

                {/* Recent Tasks */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-display font-bold text-slate-900">
                      Tâches récentes
                    </h3>
                    <Link href={`/projects/${project.id}/tasks`}>
                      <Button variant="ghost" size="sm">
                        Voir tout
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === "DONE" ? "bg-green-500" :
                            task.status === "IN_PROGRESS" ? "bg-blue-500" : "bg-slate-400"
                          }`} />
                          <span className="font-medium text-slate-900">{task.title}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          task.status === "DONE" ? "bg-green-100 text-green-700" :
                          task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {task.status === "DONE" ? "Terminée" : task.status === "IN_PROGRESS" ? "En cours" : "À faire"}
                        </span>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p className="text-center text-slate-500 py-4">Aucune tâche</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Team */}
                <Card>
                  <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
                    Équipe ({project.members.length})
                  </h3>

                  <div className="space-y-3">
                    {project.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                          {member.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-600">{member.role}</p>
                        </div>
                        {member.id === project.owner.id && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            Chef
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {isProjectAdmin && (
                    <Link href={`/projects/${project.id}/members`}>
                      <Button variant="outline" icon={Users} fullWidth className="mt-4">
                        Gérer l'équipe
                      </Button>
                    </Link>
                  )}
                </Card>

                {/* Dates */}
                <Card>
                  <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
                    Planning
                  </h3>

                  <div className="space-y-4">
                    {project.startDate && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Date de début</p>
                        <p className="font-semibold text-slate-900">
                          {new Date(project.startDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    {project.endDate && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Date de fin</p>
                        <p className="font-semibold text-slate-900">
                          {new Date(project.endDate).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    {project.startDate && project.endDate && (
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Durée</p>
                        <p className="font-semibold text-slate-900">
                          {Math.ceil(
                            (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          jours
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
                    Actions rapides
                  </h3>

                  <div className="space-y-2">
                    <Link href={`/projects/${project.id}/kanban`}>
                      <ActionCard
                        icon={BarChart3}
                        title="Voir le Kanban"
                        description="Tableau des tâches"
                        color="blue"
                        onClick={() => {}}
                      />
                    </Link>
                    <ActionCard
                      icon={FileText}
                      title="Générer rapport"
                      description="Créer un rapport"
                      color="green"
                      onClick={handleGenerateReport}
                    />
                  </div>
                </Card>

                {/* Collaboration */}
                <Card>
                  <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
                    Collaboration
                  </h3>

                  <div className="space-y-2">
                    {projectRoomId && (
                      <ActionCard
                        icon={MessageSquare}
                        title="Chat du projet"
                        description="Discutez avec l'équipe"
                        color="purple"
                        onClick={() => setIsChatOpen(true)}
                      />
                    )}
                    <ActionCard
                      icon={Paperclip}
                      title="Documents"
                      description="Gérer les fichiers"
                      color="blue"
                      onClick={() => setIsFilesOpen(true)}
                    />
                    <Link href={`/video?projectId=${project.id}`}>
                      <ActionCard
                        icon={Video}
                        title="Lancer Visio"
                        description="Conférence d'équipe"
                        color="red"
                        onClick={() => {}}
                      />
                    </Link>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Comments Tab */}
          {activeTab === "comments" && (
            <motion.div
              key="comments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Add Comment */}
              <Card>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-4">
                  Nouveau commentaire
                </h3>

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrivez votre commentaire..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all mb-4"
                />

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <Paperclip className="w-5 h-5 text-slate-600" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <Smile className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    icon={Send}
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Publier
                  </Button>
                </div>
              </Card>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card
                    key={comment.id}
                    className="bg-slate-50 border-2 border-slate-200"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                         {(comment.author?.name || comment.author?.email || "U").substring(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{comment.author?.name || comment.author?.email}</span>
                          <span className="text-sm text-slate-400">•</span>
                          <span className="text-sm text-slate-500">{formatTime(new Date(comment.createdAt))}</span>
                        </div>

                        <p className="text-slate-700 whitespace-pre-wrap">{comment.content}</p>

                        {/* Actions */}
                        <div className="flex gap-3 mt-3 text-sm">
                          <button
                            onClick={() => handleReaction(comment.id, "👍")}
                            className="text-slate-600 hover:text-blue-600 font-medium"
                          >
                            Réagir
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Aucun commentaire</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-6">
                  Activité récente
                </h3>

                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-900 leading-relaxed">
                          <span className="font-bold">{activity.user.name || activity.user.email}</span>
                          {" "}
                          {activity.details}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {formatTime(new Date(activity.createdAt))}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600">Aucune activité récente</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-bold text-slate-900">
                    Rapports du projet
                  </h3>
                  <Button variant="primary" icon={Plus} onClick={handleGenerateReport}>
                    Générer un rapport
                  </Button>
                </div>

                <div className="text-center py-12">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                    <FileText className="w-16 h-16 text-slate-400" />
                  </div>
                  <h4 className="text-xl font-display font-bold text-slate-900 mb-2">
                    Aucun rapport généré
                  </h4>
                  <p className="text-slate-600 mb-6">
                    Générez votre premier rapport pour suivre l'avancement du projet
                  </p>
                  <Button variant="primary" icon={FileText} onClick={handleGenerateReport}>
                    Créer un rapport
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
          {activeTab === "events" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div>
                   <h3 className="text-xl font-display font-bold text-slate-900">Agenda du projet</h3>
                   <p className="text-slate-500 text-sm">Réunions et deadlines importantes</p>
                </div>
                <Link href={`/events/new?projectId=${project.id}`}>
                  <Button variant="primary" icon={Plus}>Nouvel événement</Button>
                </Link>
              </div>

              {isEventsLoading ? (
                <div className="flex justify-center py-12">
                   <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : projectEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projectEvents.map((event) => (
                    <Card key={event.id} className="hover:border-blue-300 transition-colors">
                      <div className="flex gap-4">
                         <div className="w-12 h-12 bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-blue-600">
                            <span className="text-[10px] font-bold uppercase">{new Date(event.startDate).toLocaleDateString("fr-FR", { month: 'short' })}</span>
                            <span className="text-lg font-bold leading-none">{new Date(event.startDate).getDate()}</span>
                         </div>
                         <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{event.title}</h4>
                            <p className="text-sm text-slate-600 line-clamp-1 mb-2">{event.description || "Aucune description"}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                               <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </div>
                               {event.location && (
                                 <div className="flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" />
                                    {event.location}
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                  <CalendarIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-600">Aucun événement planifié</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Report Generation Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReportModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
            >
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-6">
                Générer un rapport
              </h2>

              <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2">
                {isGeneratingReport ? (
                  <div className="flex flex-col items-center justify-center py-12">
                     <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                     <p className="text-slate-600">Compilation des données en cours...</p>
                  </div>
                ) : reportData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-2xl">
                        <p className="text-sm text-blue-600 font-semibold mb-1">Progression</p>
                        <p className="text-2xl font-bold text-slate-900">{reportData.projectInfo.progress}%</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-2xl">
                        <p className="text-sm text-green-600 font-semibold mb-1">Tâches Finies</p>
                        <p className="text-2xl font-bold text-slate-900">{reportData.stats.completedTasks}/{reportData.stats.totalTasks}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Membres Actifs</h4>
                      <div className="flex flex-wrap gap-2">
                        {reportData.members.map((m: any, i: number) => (
                          <span key={i} className="px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
                            {m.name} ({m.role})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">Tâches Récentes</h4>
                      <div className="space-y-2">
                        {reportData.recentTasks.map((t: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded-lg">
                            <span className="text-slate-700 font-medium">{t.title}</span>
                            <span className="text-slate-500">{t.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                   <p className="text-center text-slate-500">Une erreur est survenue lors de la génération.</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setShowReportModal(false)}>
                  Fermer
                </Button>
                {reportData && (
                  <Button variant="primary" className="flex-1" onClick={() => window.print()}>
                    Imprimer / PDF
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contextual Drawers */}
      {project && (
        <>
          {projectRoomId && (
            <ProjectChatDrawer
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              projectId={project.id}
              projectName={project.name}
              roomId={projectRoomId}
            />
          )}
          <ProjectFilesDrawer
            isOpen={isFilesOpen}
            onClose={() => setIsFilesOpen(false)}
            projectId={project.id}
            projectName={project.name}
          />
        </>
      )}
    </div>
  );
}

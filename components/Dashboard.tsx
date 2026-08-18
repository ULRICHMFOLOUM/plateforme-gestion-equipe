"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo, useRef } from "react";
import {
  Calendar, CheckSquare, FolderOpen, Users, MessageSquare,
  FileText, Video, BarChart3, ArrowRight, User, BookOpen,
  Search, Activity, Clock, Zap, TrendingUp, Plus, Target,
  Flame, Star, Bell, ExternalLink, ChevronRight, Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SectionTransition } from "./PageTransition";
import UserAvatar from "./ui/UserAvatar";
import { useSearch } from "@/context/SearchContext";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
interface Task { id: string; title: string; status: string; priority: string; project?: { name: string } }
interface Project { id: string; name: string; status: string }
interface Event { id: string; title: string; startDate: string }
interface ProjectCard {
  id: string; name: string; status: string; progress: number;
  taskCount: number; doneCount: number;
  members: { id: string; name?: string; image?: string }[];
  updatedAt: string;
}
interface WeeklyEntry { day: string; tasks: number }
interface ActivityEntry {
  id: string; action: string; details?: string; type: string;
  createdAt: string;
  user: { name?: string; image?: string };
  project: { name: string };
}
interface DashboardProps {
  tasks: Task[]; projects: Project[]; events: Event[];
  stats?: { summary: { projects: number; avgProgress: number; taskCompletionRate: number } };
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return { text: "Bonne nuit",      emoji: "🌙" };
  if (h < 12) return { text: "Bonjour",          emoji: "☀️" };
  if (h < 17) return { text: "Bon après-midi",   emoji: "🌤️" };
  return       { text: "Bonsoir",                emoji: "🌆" };
}
function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return "À l'instant";
  if (s < 3600) return `Il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `Il y a ${Math.floor(s / 3600)} h`;
  return `Il y a ${Math.floor(s / 86400)} j`;
}

// Animated number counter
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

/* ══════════════════════════════════════════════════════════
   PROJECT STATUS CONFIG
══════════════════════════════════════════════════════════ */
const PROJECT_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
];
const STATUS_PILL: Record<string, { label: string; className: string }> = {
  ACTIVE:    { label: "En cours",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  COMPLETED: { label: "Terminé",   className: "bg-blue-50 text-blue-700 border border-blue-200" },
  ON_HOLD:   { label: "En pause",  className: "bg-amber-50 text-amber-700 border border-amber-200" },
  CANCELLED: { label: "Annulé",    className: "bg-red-50 text-red-700 border border-red-200" },
};
const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-red-500", MEDIUM: "bg-amber-400", LOW: "bg-slate-300",
};
const ACTIVITY_ICONS: Record<string, { emoji: string; color: string }> = {
  TASK_COMPLETED: { emoji: "✅", color: "bg-emerald-100" },
  TASK_CREATED:   { emoji: "📝", color: "bg-blue-100" },
  PROJECT_CREATED:{ emoji: "📁", color: "bg-purple-100" },
  PROJECT_UPDATED:{ emoji: "✏️", color: "bg-orange-100" },
  MEMBER_ADDED:   { emoji: "👤", color: "bg-cyan-100" },
  FILE_UPLOADED:  { emoji: "📎", color: "bg-pink-100" },
  COMMENT_ADDED:  { emoji: "💬", color: "bg-indigo-100" },
};

/* ══════════════════════════════════════════════════════════
   CHART TOOLTIP
══════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-2xl border border-white/10">
      <p className="font-bold text-slate-300 mb-0.5">{label}</p>
      <p className="text-blue-300 font-black text-sm">{payload[0].value} tâche{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
export default function Dashboard({ tasks, projects, events, stats: initialStats }: DashboardProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(initialStats || null);
  const [projectCards, setProjectCards] = useState<ProjectCard[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyEntry[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [unreadChatRooms, setUnreadChatRooms] = useState<number>(0);
  const { searchQuery } = useSearch();
  const greeting = getGreeting();
  const q = searchQuery.toLowerCase().trim();

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/dashboard/stats"),
      fetch("/api/dashboard/activity"),
      fetch("/api/chat/rooms"),
    ]).then(async ([statsRes, actRes, roomsRes]) => {
      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const d = await statsRes.value.json();
        setStats(d);
        if (d.projectCards) setProjectCards(d.projectCards);
        if (d.weeklyActivity) setWeeklyData(d.weeklyActivity);
      }
      if (actRes.status === "fulfilled" && actRes.value.ok) {
        const d = await actRes.value.json();
        setActivity(d.logs || []);
      }
      if (roomsRes.status === "fulfilled" && roomsRes.value.ok) {
        const dRooms = await roomsRes.value.json();
        const roomList = Array.isArray(dRooms) ? dRooms : (dRooms.rooms || []);
        const unreadCount = roomList.filter((r: any) => r.hasUnread).length;
        setUnreadChatRooms(unreadCount);
      }
    });
  }, []);

  const filteredTasks  = useMemo(() => q.length < 2 ? tasks  : tasks.filter(t => t.title.toLowerCase().includes(q) || t.project?.name?.toLowerCase().includes(q)), [tasks, q]);
  const filteredEvents = useMemo(() => q.length < 2 ? events : events.filter(e => e.title.toLowerCase().includes(q)), [events, q]);
  const isFiltering    = q.length >= 2;
  const hasNoResults   = isFiltering && filteredTasks.length === 0 && filteredEvents.length === 0;

  const todayDone   = tasks.filter(t => t.status === "DONE").length;
  const todayTotal  = tasks.length;
  const todayPct    = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  /* ══ fade-in variant ══ */
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: "easeOut" },
  });

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {/* ── Ambient blobs ── */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="relative z-10 p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">

        {/* ══════════════════════════════════════════════════
            1. HERO HEADER
        ══════════════════════════════════════════════════ */}
        <motion.div {...fadeUp(0)}
          className="relative bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden"
        >
          {/* Decorative gradient top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
          {/* Decorative blob inside card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left — Greeting */}
              <div>
                <motion.p {...fadeUp(0.05)} className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2">
                  <span className="text-base">{greeting.emoji}</span>
                  {greeting.text}
                </motion.p>
                <motion.h1 {...fadeUp(0.1)} className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  {isFiltering
                    ? <><span className="text-blue-600">Résultats</span> pour "{searchQuery}"</>
                    : <>{session?.user?.name?.split(" ")[0] || "Utilisateur"} <span className="text-blue-600">!</span></>
                  }
                </motion.h1>
                {!isFiltering && (
                  <motion.p {...fadeUp(0.15)} className="text-slate-400 mt-1 text-sm">
                    Voici un aperçu de votre espace de travail.
                  </motion.p>
                )}

                {/* Today progress bar */}
                {!isFiltering && (
                  <motion.div {...fadeUp(0.2)} className="mt-4 flex items-center gap-3">
                    <div className="flex-1 max-w-xs">
                      <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                        <span>Tâches aujourd'hui</span>
                        <span className="text-slate-600">{todayDone}/{todayTotal}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${todayPct}%` }}
                          transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                    <span className="text-sm font-black text-blue-600">{todayPct}%</span>
                  </motion.div>
                )}
              </div>

              {/* Right — User info + CTAs */}
              {!isFiltering && (
                <motion.div {...fadeUp(0.2)} className="flex items-center gap-3 flex-wrap lg:flex-nowrap shrink-0">
                  <Link href="/projects?create=1">
                    <motion.button
                      whileHover={{ scale: 1.04, boxShadow: "0 12px 32px rgba(99,102,241,0.3)" }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="w-4 h-4" /> Nouveau Projet
                    </motion.button>
                  </Link>
                  <Link href="/tasks?create=1">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:border-blue-400 hover:text-blue-600 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Nouvelle Tâche
                    </motion.button>
                  </Link>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 pr-5 rounded-2xl">
                    <UserAvatar src={session?.user?.image} name={session?.user?.name || session?.user?.email} size="sm" />
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-none">{session?.user?.name || "Utilisateur"}</p>
                      <p className="text-[10px] font-semibold text-emerald-500 mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> En ligne
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── No results state ── */}
        <AnimatePresence>
          {hasNoResults && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-xl">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-xl font-black text-slate-700 mb-1">Aucun résultat</p>
              <p className="text-slate-400">Aucun élément ne correspond à "{searchQuery}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════
            2. STAT CARDS — 4 colonnes égales
        ══════════════════════════════════════════════════ */}
        {!isFiltering && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                delay: 0.05,
                icon: FolderOpen,
                label: "Projets actifs",
                value: stats?.summary?.projects ?? projects.length,
                suffix: "",
                sub: `${projectCards.filter(p => p.status === "ACTIVE").length} en cours`,
                accent: "#3b82f6",
                iconGrad: "from-blue-500 to-indigo-600",
                shadowColor: "shadow-blue-500/10",
                href: "/projects",
                tag: "Projets",
              },
              {
                delay: 0.1,
                icon: CheckSquare,
                label: "Tâches actives",
                value: tasks.length,
                suffix: "",
                sub: `${tasks.filter(t => t.priority === "HIGH").length} urgentes`,
                accent: "#10b981",
                iconGrad: "from-emerald-500 to-teal-600",
                shadowColor: "shadow-emerald-500/10",
                href: "/tasks",
                tag: "Tâches",
              },
              {
                delay: 0.15,
                icon: TrendingUp,
                label: "Progression moy.",
                value: stats?.summary?.avgProgress ?? 0,
                suffix: "%",
                sub: "Tous les projets",
                accent: "#8b5cf6",
                iconGrad: "from-violet-500 to-purple-600",
                shadowColor: "shadow-violet-500/10",
                href: "/reports",
                tag: "Rapports",
              },
              {
                delay: 0.2,
                icon: Target,
                label: "Taux complétion",
                value: stats?.summary?.taskCompletionRate ?? 0,
                suffix: "%",
                sub: `${tasks.filter(t => t.status === "DONE").length} terminées`,
                accent: "#f59e0b",
                iconGrad: "from-amber-500 to-orange-600",
                shadowColor: "shadow-amber-500/10",
                href: "/tasks",
                tag: "Objectif",
              },
            ].map((card) => (
              <motion.div
                key={card.label}
                {...fadeUp(card.delay)}
                whileHover={{ y: -5, boxShadow: "0 20px 48px rgba(0,0,0,0.08)" }}
                className={`group relative bg-white border border-slate-100 rounded-3xl p-6 cursor-pointer overflow-hidden shadow-lg ${card.shadowColor}`}
                onClick={() => (window.location.href = card.href)}
              >
                {/* Left colored accent bar */}
                <div
                  className="absolute left-0 top-5 bottom-5 w-1 rounded-r-full group-hover:top-0 group-hover:bottom-0 group-hover:rounded-none transition-all duration-300"
                  style={{ background: card.accent }}
                />

                {/* Huge faint watermark icon */}
                <card.icon className="absolute -right-3 -bottom-3 w-24 h-24 opacity-[0.04] text-slate-900 group-hover:opacity-[0.08] transition-opacity duration-300" />

                {/* Top row: icon + tag */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-12 h-12 bg-gradient-to-br ${card.iconGrad} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">
                    {card.tag}
                  </span>
                </div>

                {/* Label */}
                <p className="text-sm font-semibold text-slate-400 mb-1.5">{card.label}</p>

                {/* Big value */}
                <p className="text-5xl font-black text-slate-900 leading-none tracking-tight mb-3">
                  <AnimatedNumber value={Number(card.value)} suffix={card.suffix} />
                </p>

                {/* Sub */}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: card.accent }} />
                  <p className="text-xs font-semibold text-slate-400">{card.sub}</p>
                </div>

                {/* Bottom line on hover */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                  style={{ background: `linear-gradient(to right, ${card.accent}cc, transparent)` }}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            3. PROJETS ACTIFS (2/3) + ACTIONS RAPIDES (1/3)
        ══════════════════════════════════════════════════ */}
        {!isFiltering && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* ── Projets Actifs (col-span-2) ── */}
            <motion.div {...fadeUp(0.25)} className="xl:col-span-2">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900">Projets Actifs</h2>
                      <p className="text-xs text-slate-400">{projectCards.length} projet{projectCards.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <Link href="/projects" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Voir tous <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Project cards grid */}
                <div className="p-5">
                  {projectCards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {projectCards.slice(0, 3).map((proj, i) => {
                        const colorGrad = PROJECT_COLORS[i % PROJECT_COLORS.length];
                        const pill = STATUS_PILL[proj.status] || STATUS_PILL["ACTIVE"];
                        return (
                          <motion.div
                            key={proj.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            whileHover={{ y: -4 }}
                            className="group bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                          >
                            {/* Color top band */}
                            <div className={`h-1.5 bg-gradient-to-r ${colorGrad}`} />

                            <div className="p-4">
                              {/* Project name + status */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <h3 className="font-black text-slate-900 text-sm leading-tight line-clamp-2">{proj.name}</h3>
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${pill.className}`}>{pill.label}</span>
                              </div>

                              {/* Progress */}
                              <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="text-slate-400 font-medium">Progression</span>
                                  <span className="font-black text-slate-700">{proj.progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${proj.progress}%` }}
                                    transition={{ delay: 0.5 + i * 0.1, duration: 1, ease: "easeOut" }}
                                    className={`h-full bg-gradient-to-r ${colorGrad} rounded-full`}
                                  />
                                </div>
                              </div>

                              {/* Members + task count */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex -space-x-1.5">
                                  {proj.members.slice(0, 4).map((m, j) => (
                                    <div key={j} className={`w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br ${PROJECT_COLORS[j % PROJECT_COLORS.length]} flex items-center justify-center text-[8px] font-black text-white shadow-sm`}>
                                      {m.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                  ))}
                                  {proj.members.length > 4 && (
                                    <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                      +{proj.members.length - 4}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {proj.doneCount}/{proj.taskCount} tâches
                                </span>
                              </div>

                              {/* CTA Button */}
                              <Link href={`/projects/${proj.id}/kanban`}>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${colorGrad} text-white text-xs font-black flex items-center justify-center gap-2 shadow-md group-hover:shadow-lg transition-shadow`}
                                >
                                  Ouvrir le Kanban <ExternalLink className="w-3 h-3" />
                                </motion.button>
                              </Link>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                        <FolderOpen className="w-8 h-8 text-blue-300" />
                      </div>
                      <p className="font-black text-slate-700 mb-1">Aucun projet</p>
                      <p className="text-sm text-slate-400 mb-4">Créez votre premier projet pour commencer</p>
                      <Link href="/projects?create=1">
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">
                          <Plus className="w-4 h-4" /> Créer un projet
                        </motion.button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Actions Rapides (col-span-1) ── */}
            <motion.div {...fadeUp(0.3)}>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 h-full">
                <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-50">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900">Accès rapide</h2>
                    <p className="text-xs text-slate-400">Naviguez rapidement</p>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {[
                    { name: "Profil",          href: "/profile",    icon: User,         gradient: "from-blue-400 to-indigo-500",   badge: null },
                    { name: "Annuaire",        href: "/directory",  icon: BookOpen,     gradient: "from-emerald-400 to-teal-500",  badge: null },
                    { name: "Messagerie",      href: "/chat",       icon: MessageSquare,gradient: "from-violet-400 to-purple-500", badge: unreadChatRooms > 0 ? unreadChatRooms : null },
                    { name: "Fichiers",        href: "/files",      icon: FileText,     gradient: "from-orange-400 to-amber-500",  badge: null },
                    { name: "Visio",           href: "/video",      icon: Video,        gradient: "from-rose-400 to-pink-500",     badge: null },
                    { name: "Rapports",        href: "/reports",    icon: BarChart3,    gradient: "from-cyan-400 to-blue-500",     badge: null },
                  ].map((action, i) => (
                    <Link key={action.name} href={action.href}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + i * 0.05 }}
                        whileHover={{ y: -3, scale: 1.03 }}
                        className="group relative bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-md transition-all"
                      >
                        {action.badge && (
                          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md">
                            {action.badge}
                          </motion.span>
                        )}
                        <div className={`w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-xs font-black text-slate-700 group-hover:text-slate-900">{action.name}</p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            4. TÂCHES (1/2) + ÉVÉNEMENTS (1/2)
        ══════════════════════════════════════════════════ */}
        {(!isFiltering || filteredTasks.length > 0 || filteredEvents.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Tâches Récentes ── */}
            {(!isFiltering || filteredTasks.length > 0) && (
              <motion.div {...fadeUp(0.35)}
                className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900">Tâches récentes</h2>
                      {isFiltering && <p className="text-xs text-slate-400">{filteredTasks.length} résultat{filteredTasks.length > 1 ? "s" : ""}</p>}
                    </div>
                  </div>
                  <Link href="/tasks" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">
                    Tout voir <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="p-5 space-y-2">
                  {filteredTasks.slice(0, 5).length > 0 ? filteredTasks.slice(0, 5).map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      whileHover={{ x: 4 }}
                      className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-100 border border-transparent transition-all cursor-pointer"
                    >
                      {/* Priority dot */}
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || PRIORITY_DOT.LOW} ring-2 ring-white`} />

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors text-sm truncate">{task.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          {task.project?.name && <><span>{task.project.name}</span><span className="text-slate-300">·</span></>}
                          <span className={`font-bold uppercase text-[10px] tracking-wide ${task.priority === "HIGH" ? "text-red-500" : task.priority === "MEDIUM" ? "text-amber-500" : "text-slate-400"}`}>{task.priority}</span>
                        </p>
                      </div>

                      {/* Status pill */}
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.status === "DONE"        ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                        task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                                                        "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                        {task.status === "DONE" ? "✓ Terminé" : task.status === "IN_PROGRESS" ? "En cours" : "À faire"}
                      </span>

                      <Link href={`/tasks/${task.id}`} className="opacity-0 group-hover:opacity-100 transition-all p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                      </Link>
                    </motion.div>
                  )) : (
                    <div className="flex flex-col items-center py-10 text-center">
                      <CheckSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium text-sm">Aucune tâche pour le moment</p>
                      <Link href="/tasks?create=1" className="inline-flex items-center gap-1 text-blue-600 font-bold text-xs mt-3 hover:underline">
                        <Plus className="w-3 h-3" /> Créer une tâche
                      </Link>
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <Link href="/tasks" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-sm transition-colors">
                    Voir toutes les tâches <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── Événements ── */}
            {(!isFiltering || filteredEvents.length > 0) && (
              <motion.div {...fadeUp(0.4)}
                className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-black text-slate-900">Événements à venir</h2>
                      {isFiltering && <p className="text-xs text-slate-400">{filteredEvents.length} résultat{filteredEvents.length > 1 ? "s" : ""}</p>}
                    </div>
                  </div>
                  <Link href="/calendar" className="flex items-center gap-1 text-sm font-bold text-violet-600 hover:text-violet-700">
                    Calendrier <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="p-5 space-y-3">
                  {filteredEvents.slice(0, 4).length > 0 ? filteredEvents.slice(0, 4).map((ev, i) => {
                    const d = new Date(ev.startDate);
                    const isToday = new Date().toDateString() === d.toDateString();
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.06 }}
                        whileHover={{ x: -4 }}
                        className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-slate-50 hover:bg-violet-50/50 border border-transparent hover:border-violet-100 transition-all cursor-pointer"
                      >
                        {/* Date block */}
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm ${isToday ? "bg-gradient-to-br from-violet-500 to-pink-600 text-white" : "bg-violet-100 text-violet-700"}`}>
                          <p className="text-[10px] font-bold uppercase leading-none">{d.toLocaleDateString("fr-FR", { month: "short" })}</p>
                          <p className="text-lg font-black leading-tight">{d.getDate()}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 group-hover:text-violet-700 transition-colors text-sm truncate">{ev.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            {isToday && <span className="ml-1 px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded text-[9px] font-black">Aujourd'hui</span>}
                          </p>
                        </div>
                      </motion.div>
                    );
                  }) : (
                    <div className="flex flex-col items-center py-10 text-center">
                      <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium text-sm">Aucun événement à venir</p>
                      <Link href="/calendar" className="inline-flex items-center gap-1 text-violet-600 font-bold text-xs mt-3 hover:underline">
                        <Plus className="w-3 h-3" /> Planifier un événement
                      </Link>
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5">
                  <Link href="/calendar" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-600 font-bold text-sm transition-colors">
                    Voir le calendrier <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            5. GRAPHIQUE HEBDO (3/5) + ACTIVITÉ (2/5)
        ══════════════════════════════════════════════════ */}
        {!isFiltering && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* ── Graphique ── */}
            <motion.div {...fadeUp(0.45)} className="xl:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900">Productivité hebdomadaire</h2>
                    <p className="text-xs text-slate-400">Tâches complétées · 7 derniers jours</p>
                  </div>
                </div>
                <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" /> En direct
                </motion.div>
              </div>
              <div className="p-6">
                <div className="h-56">
                  {weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="tasks" stroke="#6366f1" strokeWidth={3}
                          fill="url(#grad)"
                          dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    /* Skeleton bars */
                    <div className="h-full flex items-end gap-2">
                      {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d, i) => {
                        const h = [25, 55, 40, 80, 62, 20, 45];
                        return (
                          <div key={d} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div initial={{ height: 0 }} animate={{ height: `${h[i]}%` }}
                              transition={{ delay: i * 0.07, duration: 0.6, ease: "easeOut" }}
                              className="w-full bg-gradient-to-t from-indigo-200 to-indigo-100 rounded-t-xl" />
                            <span className="text-[10px] font-bold text-slate-400">{d}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-xs text-slate-500 font-medium">Tâches terminées</span>
                  </div>
                  <p className="text-sm font-black text-slate-800">
                    {weeklyData.reduce((s, d) => s + d.tasks, 0)} cette semaine
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ── Fil d'Activité ── */}
            <motion.div {...fadeUp(0.5)} className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-50">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900">Activité récente</h2>
                  <p className="text-xs text-slate-400">Dernières actions de l'équipe</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-5 overflow-y-auto max-h-72 scrollbar-hide">
                {activity.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 to-transparent" />
                    <div className="space-y-4 pl-10">
                      {activity.slice(0, 8).map((log, i) => {
                        const cfg = ACTIVITY_ICONS[log.type] || { emoji: "🔔", color: "bg-slate-100" };
                        return (
                          <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
                            {/* Timeline dot */}
                            <div className={`absolute -left-10 w-8 h-8 ${cfg.color} rounded-xl flex items-center justify-center text-sm shadow-sm border border-white`}>
                              {cfg.emoji}
                            </div>
                            <div className="hover:bg-slate-50 rounded-xl px-3 py-2 -ml-3 transition-colors">
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                <span className="font-black text-slate-900">{log.user?.name || "Quelqu'un"}</span>{" "}
                                <span className="text-slate-500">{log.action}</span>
                                {log.details && <> — <em className="text-slate-500">{log.details}</em></>}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {timeAgo(log.createdAt)} · {log.project?.name}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Placeholder entries */
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 to-transparent" />
                    <div className="space-y-4 pl-10">
                      {[
                        { emoji: "✅", color: "bg-emerald-50", name: "Système",  action: "TeamFlow est prêt à l'emploi",   time: "Maintenant" },
                        { emoji: "📁", color: "bg-blue-50",    name: "Guide",    action: "Créez votre premier projet",     time: "Il y a 1 min" },
                        { emoji: "📝", color: "bg-violet-50",  name: "Astuce",   action: "Assignez des tâches à l'équipe", time: "Il y a 2 min" },
                        { emoji: "💬", color: "bg-amber-50",   name: "Tips",     action: "Utilisez le chat pour collaborer", time: "Il y a 3 min" },
                      ].map((p, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative">
                          <div className={`absolute -left-10 w-8 h-8 ${p.color} rounded-xl flex items-center justify-center text-sm shadow-sm border border-white`}>{p.emoji}</div>
                          <div className="hover:bg-slate-50 rounded-xl px-3 py-2 -ml-3 transition-colors">
                            <p className="text-xs text-slate-700 font-medium">
                              <span className="font-black text-slate-900">{p.name}</span> <span className="text-slate-500">{p.action}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {p.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <Link href="/notifications" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-sm transition-colors">
                  Toutes les activités <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}

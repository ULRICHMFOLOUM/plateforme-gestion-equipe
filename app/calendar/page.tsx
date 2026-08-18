"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Plus, Calendar as CalendarIcon, Filter, X, Loader2, CheckCircle2,
  Clock, AlertTriangle, ArrowLeft, Video, Tag,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

const locales = { fr };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: {
    type: "task" | "event";
    task?: any;
    event?: any;
    color?: string;
  };
}

// ── Quick Create Modal ────────────────────────────────────
function QuickCreateModal({
  slot,
  onClose,
  onCreated,
}: {
  slot: { start: Date; end: Date } | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [mode, setMode] = useState<"event" | "task">("event");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [loading, setLoading] = useState(false);

  if (!slot) return null;

  const handleCreate = async () => {
    if (!title.trim()) { showToast({ type: "error", title: "Le titre est requis" }); return; }
    setLoading(true);
    try {
      if (mode === "event") {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, description, location,
            startDate: slot.start.toISOString(),
            endDate: slot.end.toISOString(),
          }),
        });
        if (res.ok) {
          showToast({ type: "success", title: "Événement créé !", message: title });
          onCreated();
          onClose();
        }
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title, description, priority,
            dueDate: slot.start.toISOString(),
          }),
        });
        if (res.ok) {
          showToast({ type: "success", title: "Tâche créée !", message: title });
          onCreated();
          onClose();
        }
      }
    } catch {
      showToast({ type: "error", title: "Erreur lors de la création" });
    } finally {
      setLoading(false);
    }
  };

  const dateStr = slot.start.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Créer</h3>
            <p className="text-sm text-slate-400 font-medium mt-0.5 capitalize">{dateStr}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5">
          <button
            onClick={() => setMode("event")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${mode === "event" ? "bg-white text-violet-600 shadow-md" : "text-slate-500"}`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Événement
          </button>
          <button
            onClick={() => setMode("task")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${mode === "task" ? "bg-white text-blue-600 shadow-md" : "text-slate-500"}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Tâche
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === "event" ? "Titre de l'événement..." : "Titre de la tâche..."}
            className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none transition-all"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnel)..."
            rows={2}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none transition-all resize-none"
          />
          {mode === "event" ? (
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lieu (salle, lien visio...)"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none transition-all"
            />
          ) : (
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-bold outline-none"
            >
              <option value="LOW">Priorité basse</option>
              <option value="MEDIUM">Priorité moyenne</option>
              <option value="HIGH">Priorité haute</option>
            </select>
          )}

          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {loading ? "Création..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Event Detail Tooltip/Modal ────────────────────────────
function EventDetailModal({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  const isTask = event.resource.type === "task";
  const task = event.resource.task;
  const calEvent = event.resource.event;
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" />
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 z-10" onClick={(e) => e.stopPropagation()}>
        {/* Color bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-[2rem] ${isTask ? (task?.priority === "HIGH" ? "bg-red-500" : task?.priority === "MEDIUM" ? "bg-amber-500" : "bg-emerald-500") : "bg-violet-500"}`} />

        <div className="flex items-start justify-between mb-4 mt-1">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${isTask ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"}`}>
                {isTask ? "Tâche" : "Événement"}
              </span>
            </div>
            <h4 className="text-lg font-black text-slate-900 leading-tight">{event.title.replace(/^\[.*?\] /, "")}</h4>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl ml-2"><X className="w-4 h-4" /></button>
        </div>

        {isTask && task && (
          <div className="space-y-2.5 mb-5">
            {task.description && <p className="text-sm text-slate-600 font-medium">{task.description}</p>}
            {task.project && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-bold text-blue-600">{task.project.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              Échéance : {new Date(event.start).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}
            </div>
          </div>
        )}

        {!isTask && calEvent && (
          <div className="space-y-2.5 mb-5">
            {calEvent.description && <p className="text-sm text-slate-600 font-medium">{calEvent.description}</p>}
            {calEvent.location && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-bold">📍</span> {calEvent.location}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {new Date(event.start).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })}
              {" · "}
              {new Date(event.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {" — "}
              {new Date(event.end).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {isTask && (
            <button
              onClick={() => router.push(`/tasks/${event.id}`)}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 transition-colors"
            >
              Voir la tâche
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-200 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar Page ────────────────────────────────────
function CalendarPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [quickCreateSlot, setQuickCreateSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const q = projectId ? `?projectId=${projectId}` : "";
      const [tasksRes, eventsRes] = await Promise.all([
        fetch(`/api/tasks${q}${projectId ? "&" : "?"}status=TODO&status=IN_PROGRESS`),
        fetch(`/api/events${q}`),
      ]);

      let allEvents: CalEvent[] = [];

      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        const taskEvents = tasks
          .filter((t: any) => t.dueDate)
          .map((t: any) => ({
            id: t.id,
            title: `✅ ${t.title}`,
            start: new Date(t.dueDate),
            end: new Date(t.dueDate),
            allDay: true,
            resource: { type: "task" as const, task: t },
          }));
        allEvents = [...allEvents, ...taskEvents];
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const calEvents = eventsData.map((e: any) => ({
          id: e.id,
          title: `📅 ${e.title}`,
          start: new Date(e.startDate),
          end: new Date(e.endDate || e.startDate),
          allDay: false,
          resource: { type: "event" as const, event: e },
        }));
        allEvents = [...allEvents, ...calEvents];
      }

      setEvents(allEvents);
    } catch (err) {
      console.error("Erreur calendrier:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchData();
      fetchProjects();
    }
  }, [session, status, projectId]);

  const eventStyleGetter = (event: CalEvent) => {
    let bg = "#6366f1"; // default indigo
    if (event.resource.type === "event") bg = "#8B5CF6";
    else if (event.resource.task?.priority === "HIGH") bg = "#EF4444";
    else if (event.resource.task?.priority === "MEDIUM") bg = "#F59E0B";
    else if (event.resource.task?.priority === "LOW") bg = "#10B981";

    return {
      style: {
        backgroundColor: bg,
        borderRadius: "8px",
        color: "white",
        border: "none",
        fontSize: "11px",
        fontWeight: "700",
        padding: "2px 6px",
      },
    };
  };

  const messages = {
    allDay: "Toute la journée",
    previous: "◀",
    next: "▶",
    today: "Aujourd'hui",
    month: "Mois",
    week: "Semaine",
    day: "Jour",
    agenda: "Agenda",
    date: "Date",
    time: "Heure",
    event: "Événement",
    noEventsInRange: "Aucun événement dans cette période.",
    showMore: (n: number) => `+ ${n} autres`,
  };

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  return (
    <DashboardWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm text-slate-600 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Calendrier</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {events.length} événement{events.length > 1 ? "s" : ""} · Cliquez sur un créneau pour créer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Project filter */}
            <select
              value={projectId || ""}
              onChange={(e) => {
                const val = e.target.value;
                router.push(val ? `/calendar?projectId=${val}` : "/calendar");
              }}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm"
            >
              <option value="">Tous les projets</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <Link
              href="/events/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
            >
              <CalendarIcon className="w-4 h-4" /> Nouvel événement
            </Link>

            <button
              onClick={() => setQuickCreateSlot({ start: new Date(), end: new Date(Date.now() + 3600000) })}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Créer
            </button>
          </div>
        </div>

        {/* Calendar */}
        <Card className="p-6 border-none shadow-2xl shadow-blue-500/5 bg-white rounded-3xl overflow-hidden">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 620 }}
              eventPropGetter={eventStyleGetter}
              messages={messages}
              culture="fr"
              views={["month", "week", "day"]}
              defaultView="month"
              popup
              selectable
              onSelectSlot={(slotInfo) => {
                setQuickCreateSlot({ start: slotInfo.start, end: slotInfo.end });
              }}
              onSelectEvent={(event) => setSelectedEvent(event)}
            />
          )}
        </Card>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { color: "bg-red-500", label: "Tâche haute priorité", icon: AlertTriangle },
            { color: "bg-amber-500", label: "Tâche priorité moyenne", icon: Clock },
            { color: "bg-emerald-500", label: "Tâche basse priorité", icon: CheckCircle2 },
            { color: "bg-violet-500", label: "Événement planifié", icon: CalendarIcon },
          ].map(({ color, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
              <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-bold text-slate-600 leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick create modal */}
      {quickCreateSlot && (
        <QuickCreateModal
          slot={quickCreateSlot}
          onClose={() => setQuickCreateSlot(null)}
          onCreated={fetchData}
        />
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </DashboardWrapper>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CalendarPageContent />
    </Suspense>
  );
}

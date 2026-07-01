"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, Calendar as CalendarIcon, Filter } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: any;
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function CalendarPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    fetchData();
    fetchProjects();
  }, [session, projectId, status]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        setProjects(await response.json());
      }
    } catch (err) {}
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const queryParams = projectId ? `?projectId=${projectId}` : "";
      
      const [tasksRes, eventsRes] = await Promise.all([
        fetch(`/api/tasks${queryParams}${projectId ? '&' : '?'}status=TODO&status=IN_PROGRESS`),
        fetch(`/api/events${queryParams}`)
      ]);

      let allEvents: Event[] = [];

      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        const taskEvents = tasks
          .filter((task: any) => task.dueDate)
          .map((task: any) => ({
            id: task.id,
            title: `[Tâché] ${task.title}`,
            start: new Date(task.dueDate),
            end: new Date(task.dueDate),
            allDay: true,
            resource: { type: "task", task },
          }));
        allEvents = [...allEvents, ...taskEvents];
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const calEvents = eventsData.map((event: any) => ({
          id: event.id,
          title: `[Event] ${event.title}`,
          start: new Date(event.startDate),
          end: new Date(event.endDate || event.startDate),
          allDay: false,
          resource: { type: "event", event },
        }));
        allEvents = [...allEvents, ...calEvents];
      }

      setEvents(allEvents);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const eventStyleGetter = (event: Event) => {
    let backgroundColor = "#3B82F6"; // blue-500

    if (event.resource?.type === "event") {
      backgroundColor = "#8B5CF6"; // purple-500
    } else if (event.resource?.task?.priority === "HIGH") {
      backgroundColor = "#EF4444"; // red-500
    } else if (event.resource?.task?.priority === "MEDIUM") {
      backgroundColor = "#F59E0B"; // yellow-500
    } else if (event.resource?.task?.priority === "LOW") {
      backgroundColor = "#10B981"; // green-500
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  const EventComponent = ({ event }: { event: Event }) => (
    <div className="p-1">
      <div className="font-medium text-sm truncate">{event.title}</div>
      {event.resource?.task?.project && (
        <div className="text-xs opacity-90 truncate">
          {event.resource.task.project.name}
        </div>
      )}
    </div>
  );

  const messages = {
    allDay: "Toute la journée",
    previous: "Précédent",
    next: "Suivant",
    today: "Aujourd'hui",
    month: "Mois",
    week: "Semaine",
    day: "Jour",
    agenda: "Agenda",
    date: "Date",
    time: "Heure",
    event: "Événement",
    noEventsInRange: "Aucun événement dans cette période.",
    showMore: (total: number) => `+ ${total} autres`,
  };

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  if (isLoading) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement du calendrier...</p>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
              Calendrier
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Gérez vos tâches et événements par date
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
              <Filter className="w-4 h-4 text-slate-400 ml-3" />
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-600 pr-10 py-2"
                value={projectId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  window.location.href = val ? `/calendar?projectId=${val}` : '/calendar';
                }}
              >
                <option value="">Tous les projets</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/events/new"
                className="inline-flex items-center px-5 py-2.5 border-2 border-slate-200 text-sm font-bold rounded-2xl text-slate-700 bg-white hover:bg-slate-50 transition-all"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Événement
              </Link>
              <Button
                onClick={() => router.push("/tasks/new")}
                variant="primary"
                className="rounded-2xl shadow-xl shadow-blue-500/20"
                icon={Plus}
              >
                Nouvelle tâche
              </Button>
            </div>
          </div>
        </div>

        <Card className="p-6 border-none shadow-2xl shadow-blue-500/5 bg-white/70 backdrop-blur-xl">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent,
            }}
            messages={messages}
            culture="fr"
            views={["month", "week", "day"]}
            defaultView="month"
            onView={(newView) => setView(newView as any)}
            popup
            selectable
            onSelectEvent={(event) => {
              if (event.resource?.type === "task") {
                window.open(`/tasks/${event.id}`, "_blank");
              }
            }}
          />
        </Card>

        {/* Légende */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/30"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Haute Priorité</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/30"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Moyenne</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Basse</span>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/30"></div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Terminée</span>
          </div>
        </div>
      </div>
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

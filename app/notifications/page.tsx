"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Check, 
  Trash2, 
  Clock, 
  Search, 
  ClipboardList,
  UserPlus,
  CheckCircle2,
  Globe,
  Calendar
} from "lucide-react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import { Card } from "@/components/ui/Card";

type NotificationType = "CONTACT_REQUEST" | "CONTACT_ACCEPTED" | "PROJECT_INVITE" | "TASK_ASSIGNED" | "TASK_COMPLETED" | "GENERAL";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: string;
}

const typeIcons: Record<NotificationType, any> = {
  CONTACT_REQUEST: UserPlus,
  CONTACT_ACCEPTED: UserPlus,
  PROJECT_INVITE: UserPlus,
  TASK_ASSIGNED: ClipboardList,
  TASK_COMPLETED: CheckCircle2,
  GENERAL: Globe,
};

const typeColors: Record<NotificationType, string> = {
  CONTACT_REQUEST: "text-blue-600 bg-blue-100",
  CONTACT_ACCEPTED: "text-green-600 bg-green-100",
  PROJECT_INVITE: "text-indigo-600 bg-indigo-100",
  TASK_ASSIGNED: "text-orange-600 bg-orange-100",
  TASK_COMPLETED: "text-emerald-600 bg-emerald-100",
  GENERAL: "text-slate-600 bg-slate-100",
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
    }
  }, [status]);

  const fetchNotifications = async () => {
    try {
      const resp = await fetch("/api/notifications");
      if (resp.ok) {
        const data = await resp.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === "ALL" || !n.read;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (status === "loading" || isLoading) return <LoadingScreen />;
  if (!session) return null;

  return (
    <DashboardWrapper>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
              Centre de <span className="text-blue-600">Notifications</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              Restez informé des activités et des alertes importantes.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-1.5 rounded-[1.5rem] shadow-sm border border-slate-200">
             <button 
              onClick={() => setFilter("ALL")}
              className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all ${filter === "ALL" ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:text-slate-800"}`}
             >
               Toutes
             </button>
             <button 
              onClick={() => setFilter("UNREAD")}
              className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all ${filter === "UNREAD" ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:text-slate-800"}`}
             >
               Non lues
             </button>
          </div>
        </div>

        {/* Search Area */}
        <Card className="p-4 border-none shadow-xl shadow-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <div className="relative flex items-center px-4 group">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors mr-4" />
            <input 
              type="text" 
              placeholder="Rechercher une notification (par titre, contenu...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none py-4 text-lg font-medium outline-none placeholder:text-slate-300"
            />
          </div>
        </Card>

        {/* Notifications List */}
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => {
                const Icon = typeIcons[notif.type] || Bell;
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group bg-white rounded-[2rem] p-6 shadow-sm border transition-all hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 ${!notif.read ? "border-blue-100 bg-blue-50/10" : "border-slate-50"}`}
                    key={notif.id}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-6 shadow-lg ${typeColors[notif.type]}`}>
                        <Icon className="w-7 h-7" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {!notif.read && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />}
                          <h3 className={`text-xl font-black truncate ${notif.read ? "text-slate-700" : "text-slate-900"}`}>
                            {notif.title}
                          </h3>
                        </div>
                        <p className={`text-lg leading-relaxed ${notif.read ? "text-slate-500" : "text-slate-600 font-bold"}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-6 mt-4">
                           <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(notif.createdAt).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}
                           </div>
                           <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(notif.createdAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                           </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!notif.read && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                            title="Marquer comme lu"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notif.id)}
                          className="bg-red-50 text-red-500 p-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-24 text-center">
                <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce duration-[3s]">
                  <Bell className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-3xl font-display font-black text-slate-900 mb-4">Silence radio !</h3>
                <p className="text-slate-400 max-w-sm mx-auto text-lg font-medium">
                  {searchQuery ? "Aucune notification ne correspond à votre recherche actuelle." : "Votre boîte de réception est vide. Profitez de ce moment de calme !"}
                </p>
                {searchQuery && (
                   <button onClick={() => setSearchQuery("")} className="mt-8 px-8 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black hover:bg-blue-100 transition-all">
                      Réinitialiser la recherche
                   </button>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardWrapper>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Check, 
  Trash2, 
  Clock, 
  UserPlus, 
  ClipboardList, 
  CheckCircle2, 
  Globe, 
  X,
  MoreVertical,
  Settings,
  ShieldCheck
} from "lucide-react";
import { Button } from "./ui/Button";
import Link from "next/link";

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
  CONTACT_REQUEST: "bg-blue-100 text-blue-600",
  CONTACT_ACCEPTED: "bg-green-100 text-green-600",
  PROJECT_INVITE: "bg-indigo-100 text-indigo-600",
  TASK_ASSIGNED: "bg-orange-100 text-orange-600",
  TASK_COMPLETED: "bg-emerald-100 text-emerald-600",
  GENERAL: "bg-slate-100 text-slate-600",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setIsRefreshing(true);
    try {
      const resp = await fetch("/api/notifications?unread=false");
      if (resp.ok) {
        const data = await resp.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (error) {
      console.error("Error marking as read:", error);
      fetchNotifications(); // Rollback on error
    }
  };

  const markAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      fetchNotifications();
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diffInSec < 60) return "À l'instant";
    if (diffInSec < 3600) return `Il y a ${Math.floor(diffInSec / 60)} min`;
    if (diffInSec < 86400) return `Il y a ${Math.floor(diffInSec / 3600)} h`;
    return d.toLocaleDateString("fr-FR");
  };

  return (
    <div className="relative" ref={bellRef}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition-all relative ${isOpen ? "bg-slate-100 text-blue-600" : "text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200"}`}
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-lg shadow-red-500/30 border-2 border-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="absolute right-0 mt-3 w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
            >
              {/* Dropdown Header */}
              <div className="p-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-slate-900 text-lg">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllRead}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 underline decoration-blue-200 underline-offset-4 transition-all"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  Vous avez {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
                </p>
              </div>

              {/* Notifications List */}
              <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
                {notifications.length > 0 ? (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: { transition: { staggerChildren: 0.05 } }
                    }}
                    className="divide-y divide-slate-50"
                  >
                    {notifications.map((notif) => {
                      const Icon = typeIcons[notif.type] || Globe;
                      const color = typeColors[notif.type] || typeColors.GENERAL;
                      
                      return (
                        <motion.div 
                          key={notif.id}
                          variants={{
                            hidden: { x: -20, opacity: 0 },
                            visible: { x: 0, opacity: 1 }
                          }}
                          className={`p-4 hover:bg-slate-50/80 transition-all relative group flex gap-4 ${!notif.read ? "bg-blue-50/10" : "opacity-90"}`}
                        >
                          {/* Left Icon Block */}
                          <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          {/* Content Block */}
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-start justify-between mb-0.5">
                              <p className={`text-sm font-bold truncate ${!notif.read ? "text-slate-900" : "text-slate-600"}`}>
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm mt-1.5 flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-xs leading-relaxed text-slate-500 font-medium line-clamp-2 mb-2">
                              {notif.message}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {formatTime(notif.createdAt)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions Block (only on hover) */}
                          <div className="absolute right-3 top-4 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                            {!notif.read && (
                              <button 
                                onClick={() => markAsRead(notif.id)}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-md text-emerald-600 hover:bg-emerald-50 border border-slate-100 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => deleteNotification(notif.id)}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-md text-red-500 hover:bg-red-50 border border-slate-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <div className="py-20 px-8 text-center bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Bell className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="font-bold text-slate-900 mb-1">Tout est à jour !</p>
                    <p className="text-sm text-slate-500">Vous n'avez aucune nouvelle notification pour le moment.</p>
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-center">
                <Link 
                  href="/notifications" 
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-all group"
                  onClick={() => setIsOpen(false)}
                >
                  <Globe className="w-4 h-4" />
                  <span>Historique des notifications</span>
                  <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

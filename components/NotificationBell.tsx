"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Check, Trash2, Clock, UserPlus, ClipboardList,
  CheckCircle2, Globe, X, Volume2, VolumeX, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { playNotificationSound, getSavedSoundPreference } from "@/lib/audio";
import { requestPushPermission, showSystemNotification } from "@/lib/push";

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const bellRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    requestPushPermission();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const resp = await fetch("/api/notifications?unread=false");
      if (resp.ok) {
        const data = await resp.json();
        const newUnread = data.unreadCount || 0;
        const newNotifs: Notification[] = data.notifications || [];

        // Play chime & show system notification if new unread arrived
        if (newUnread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
          if (soundEnabled) {
            playNotificationSound(getSavedSoundPreference());
          }
          const latest = newNotifs.find((n) => !n.read);
          if (latest) {
            showSystemNotification(latest.title, { body: latest.message });
          }
        }
        prevUnreadRef.current = newUnread;

        setNotifications(newNotifs);
        setUnreadCount(newUnread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (error) {
      console.error("Error marking as read:", error);
      fetchNotifications();
    }
  };

  const markAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch (error) {
      console.error("Error marking all read:", error);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      fetchNotifications();
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const diffInSec = Math.floor((Date.now() - d.getTime()) / 1000);
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
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0 && soundEnabled) {
            playNotificationSound(getSavedSoundPreference());
          }
        }}
        className={`p-2.5 rounded-xl transition-all relative ${
          isOpen ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200"
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-md shadow-red-500/30 border-2 border-white animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs sm:bg-transparent" onClick={() => setIsOpen(false)} />

            {/* Dropdown Container — Fully responsive for mobile & desktop */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="fixed top-16 left-3 right-3 sm:left-auto sm:right-0 sm:absolute sm:top-full sm:mt-3 w-auto sm:w-[420px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden flex flex-col"
            >
              {/* Dropdown Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">Notifications</h3>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      title={soundEnabled ? "Désactiver les sons" : "Activer les sons"}
                    >
                      {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-500" /> : <VolumeX className="w-4 h-4 text-slate-300" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4"
                      >
                        Tout lire
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  Vous avez <strong className="text-slate-700">{unreadCount}</strong> notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
                </p>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[50vh] sm:max-h-[380px] p-1">
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const Icon = typeIcons[notif.type] || Globe;
                    const color = typeColors[notif.type] || typeColors.GENERAL;

                    return (
                      <div
                        key={notif.id}
                        className={`p-3.5 sm:p-4 rounded-2xl transition-all relative group flex gap-3 sm:gap-4 items-start my-1 ${
                          !notif.read ? "bg-blue-50/40 border border-blue-100/50" : "hover:bg-slate-50 opacity-90"
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${color}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <p className={`text-xs sm:text-sm font-bold break-words ${!notif.read ? "text-slate-900" : "text-slate-700"}`}>
                              {notif.title}
                            </p>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                          </div>
                          <p className="text-xs leading-relaxed text-slate-500 font-medium break-words mb-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            {formatTime(notif.createdAt)}
                          </div>
                        </div>

                        {/* Delete & Mark Read actions */}
                        <div className="absolute right-2 top-3 flex flex-col gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-md text-emerald-600 hover:bg-emerald-50 border border-slate-100"
                              title="Marquer lu"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-md text-red-500 hover:bg-red-50 border border-slate-100"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-14 text-center">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-800 text-sm mb-1">Aucune notification</p>
                    <p className="text-xs text-slate-400">Vous êtes à jour !</p>
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center flex-shrink-0">
                <Link
                  href="/notifications"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 py-1"
                  onClick={() => setIsOpen(false)}
                >
                  <span>Voir toutes les notifications</span>
                  <Globe className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

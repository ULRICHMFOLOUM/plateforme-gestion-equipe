"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  CheckSquare,
  FolderOpen,
  Calendar,
  MessageSquare,
  FileText,
  Video,
  BarChart3,
  Users,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  Layout,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";

const navigation = [
  {
    title: "GÉNÉRAL",
    items: [
      { name: "Tableau de bord", href: "/dashboard", icon: Home, color: "text-blue-500", bgColor: "bg-blue-50" },
      { name: "Projets", href: "/projects", icon: FolderOpen, color: "text-green-500", bgColor: "bg-green-50" },
      { name: "Tâches", href: "/tasks", icon: CheckSquare, color: "text-orange-500", bgColor: "bg-orange-50" },
      { name: "Calendrier", href: "/calendar", icon: Calendar, color: "text-purple-500", bgColor: "bg-purple-50" },
    ],
  },
  {
    title: "COLLABORATION",
    items: [
      { name: "Messagerie", href: "/chat", icon: MessageSquare, color: "text-indigo-500", bgColor: "bg-indigo-50" },
      { name: "Visioconférence", href: "/video", icon: Video, color: "text-red-500", bgColor: "bg-red-50" },
      { name: "Notifications", href: "/notifications", icon: Bell, color: "text-yellow-500", bgColor: "bg-yellow-50" },
    ],
  },
  {
    title: "OUTILS",
    items: [
      { name: "Fichiers", href: "/files", icon: FileText, color: "text-cyan-500", bgColor: "bg-cyan-50" },
      { name: "Rapports", href: "/reports", icon: BarChart3, color: "text-emerald-500", bgColor: "bg-emerald-50" },
    ],
  },
  {
    title: "SYSTÈME",
    items: [
      { name: "Administration", href: "/admin", icon: Shield, color: "text-rose-500", bgColor: "bg-rose-50", adminOnly: true },
      { name: "Paramètres", href: "/settings", icon: Settings, color: "text-slate-500", bgColor: "bg-slate-100" },
    ],
  },
];

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(session?.user?.image || null);
  const [userName, setUserName] = useState<string | null>(session?.user?.name || session?.user?.email || null);

  useEffect(() => {
    if (session?.user?.image) setUserImage(session.user.image);
    if (session?.user?.name) setUserName(session.user.name);
  }, [session]);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.image) setUserImage(data.image);
        if (data?.name) setUserName(data.name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.image !== undefined) setUserImage(e.detail.image);
      if (e.detail?.name !== undefined) setUserName(e.detail.name);
    };
    window.addEventListener("profileUpdated", handler);
    return () => window.removeEventListener("profileUpdated", handler);
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-xl shadow-slate-200/20">
      {/* Logo Section */}
      <div className="flex flex-col pt-8 pb-6 px-6">
        <Link href="/dashboard" className="flex items-center group" onClick={onLinkClick}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:rotate-6 transition-transform duration-300">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3 flex flex-col">
            <span className="text-xl font-display font-black text-slate-900 tracking-tight leading-none">
              Team<span className="text-blue-600">Flow</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mt-1 transition-colors group-hover:text-blue-500">
              ENTERPRISE
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 flex flex-col px-4 overflow-y-auto scrollbar-hide">
        <nav className="mt-4 flex-1 space-y-8">
          {navigation.map((section) => {
            if (section.title === "SYSTÈME" && !isAdmin) {
              const visibleItems = section.items.filter((i) => !i.adminOnly);
              if (visibleItems.length === 0) return null;
            }

            return (
              <div key={section.title} className="space-y-2">
                <h3 className="px-4 text-[11px] font-black text-slate-400 tracking-[0.15em] uppercase">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;

                    const isActive = pathname === item.href;
                    const isHovered = hoveredItem === item.name;

                    return (
                      <motion.div
                        key={item.name}
                        onMouseEnter={() => setHoveredItem(item.name)}
                        onMouseLeave={() => setHoveredItem(null)}
                        whileHover={{ x: 4 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      >
                        <Link
                          href={item.href}
                          onClick={onLinkClick}
                          className={`group flex items-center px-4 py-2.5 text-sm font-bold rounded-2xl transition-all duration-200 relative ${
                            isActive
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                              : "text-slate-600 hover:bg-white hover:shadow-md hover:shadow-slate-200/50"
                          }`}
                        >
                          <div
                            className={`mr-3 p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? "bg-white/20 text-white"
                                : `${item.bgColor} ${item.color} group-hover:scale-110 transition-transform`
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="flex-1 truncate">{item.name}</span>

                          {isActive && (
                            <motion.div
                              layoutId="active-indicator"
                              className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                            />
                          )}

                          {isHovered && !isActive && (
                            <ChevronRight className="w-3 h-3 text-slate-300 animate-pulse" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="p-4 bg-gradient-to-t from-white via-white/90 to-transparent border-t border-slate-100/50">
        <div className="flex items-center p-3 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-sm group hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:ring-2 ring-blue-500/20 transition-all">
            {userImage && (userImage.startsWith("http") || userImage.startsWith("data:image")) ? (
              <img src={userImage} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-black">
                {(userName || session?.user?.email || "?").substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">
              {userName || session?.user?.name || "Utilisateur"}
            </p>
            <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tight">
              {session?.user?.role === "ADMIN" ? "Administrateur" : "Membre de l'équipe"}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="ml-2 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* ─── Desktop Sidebar (toujours visible ≥ md) ─── */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-30">
        <SidebarContent />
      </div>

      {/* ─── Mobile Sidebar Drawer (< md) ─── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
              onClick={close}
            />

            {/* Drawer Panel */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[80vw] max-w-xs flex flex-col md:hidden"
            >
              {/* Close button */}
              <button
                onClick={close}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <SidebarContent onLinkClick={close} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

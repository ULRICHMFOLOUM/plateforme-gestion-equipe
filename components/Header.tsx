"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Search,
  ChevronRight,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Loader2,
} from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { useSidebar } from "@/context/SidebarContext";
import NotificationBell from "./NotificationBell";
import UserAvatar from "./ui/UserAvatar";

interface SearchResult {
  projects: Array<{ id: string; name: string; description?: string; status: string; color: string }>;
  tasks: Array<{ id: string; title: string; status: string; priority: string; projectId?: string; project?: { name: string } }>;
  users: Array<{ id: string; name?: string; email: string; image?: string; jobTitle?: string }>;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  ARCHIVED: "bg-slate-100 text-slate-700",
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-600",
  DONE: "bg-green-100 text-green-600",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  COMPLETED: "Terminé",
  ARCHIVED: "Archivé",
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Fait",
};

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen: isSidebarOpen, toggle: toggleSidebar } = useSidebar();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Sync from session when it loads
  useEffect(() => {
    if (session?.user?.image) setUserImage(session.user.image);
    if (session?.user?.name) setUserName(session.user.name);
  }, [session]);

  // Fetch fresh data from API on mount (bypasses JWT cache)
  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.image) setUserImage(data.image);
        if (data?.name) setUserName(data.name);
      })
      .catch(() => {});
  }, []);

  // Listen to real-time profile updates
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.image !== undefined) setUserImage(e.detail.image);
      if (e.detail?.name !== undefined) setUserName(e.detail.name);
    };
    window.addEventListener('profileUpdated', handler);
    return () => window.removeEventListener('profileUpdated', handler);
  }, []);

  // Shared search context (for dashboard filtering)
  const { searchQuery, setSearchQuery } = useSearch();

  // Local search state (for API results dropdown)
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.8)"]);
  const headerBorder = useTransform(scrollY, [0, 50], ["rgba(226, 232, 240, 0)", "rgba(226, 232, 240, 1)"]);

  const generateBreadcrumbs = () => {
    const parts = pathname.split("/").filter((p) => p !== "");
    return parts.map((part, index) => {
      const href = "/" + parts.slice(0, index + 1).join("/");
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
      return { label, href, isLast: index === parts.length - 1 };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  // Debounced search
  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
        setIsSearchOpen(true);
      }
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }
    searchTimerRef.current = setTimeout(() => performSearch(searchQuery), 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, performSearch]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setIsSearchOpen(false);
  };

  const handleResultClick = (href: string) => {
    router.push(href);
    clearSearch();
  };

  const hasResults = searchResults && (
    searchResults.projects.length > 0 ||
    searchResults.tasks.length > 0 ||
    searchResults.users.length > 0
  );

  if (status === "loading") {
    return (
      <header className="fixed top-0 w-full z-50 h-20 border-b border-transparent">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
          <div className="w-10 h-10 bg-slate-100 rounded-full animate-pulse" />
        </div>
      </header>
    );
  }

  if (!session) return null;

  return (
    <>
      <motion.header
        style={{ backgroundColor: headerBg, borderColor: headerBorder }}
        className="fixed top-0 right-0 left-0 md:left-72 z-50 backdrop-blur-md border-b transition-colors duration-300 h-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full gap-8">

            {/* Left: Breadcrumbs */}
            <div className="flex items-center gap-4 flex-1">
              <div className="flex lg:hidden items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
              </div>
              <nav className="hidden md:flex items-center text-sm font-medium text-slate-500 overflow-hidden whitespace-nowrap">
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>TeamFlow</span>
                </Link>
                {breadcrumbs.map((crumb) => (
                  <div key={crumb.href} className="flex items-center">
                    <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
                    <Link
                      href={crumb.href}
                      className={`${crumb.isLast ? "text-slate-900 font-bold" : "hover:text-blue-600"} transition-colors`}
                    >
                      {crumb.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>

            {/* Middle: Global Search */}
            <div className="hidden lg:flex items-center flex-1 max-w-md" ref={searchRef}>
              <div className="relative w-full">
                <div className="relative">
                  {isSearching ? (
                    <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                  ) : (
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearchOpen ? "text-blue-500" : "text-slate-400"}`} />
                  )}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (searchResults) setIsSearchOpen(true); }}
                    placeholder="Rechercher un projet, une tâche..."
                    className="w-full bg-slate-100/50 border-2 border-transparent focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 rounded-2xl py-2.5 pl-11 pr-10 text-sm font-medium outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden max-h-[480px] overflow-y-auto"
                    >
                      {!hasResults ? (
                        <div className="py-10 px-6 text-center">
                          <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-500">Aucun résultat pour "{searchQuery}"</p>
                        </div>
                      ) : (
                        <div className="p-2">
                          {/* Projects */}
                          {searchResults?.projects.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Projets</p>
                              {searchResults.projects.map((project) => (
                                <button
                                  key={project.id}
                                  onClick={() => handleResultClick(`/projects/${project.id}`)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-all text-left group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <FolderOpen className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{project.name}</p>
                                    {project.description && (
                                      <p className="text-xs text-slate-500 truncate">{project.description}</p>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[project.status] || "bg-slate-100 text-slate-600"}`}>
                                    {statusLabels[project.status] || project.status}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Tasks */}
                          {searchResults?.tasks.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Tâches</p>
                              {searchResults.tasks.map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => handleResultClick(task.projectId ? `/projects/${task.projectId}` : "/tasks")}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-all text-left group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <CheckSquare className="w-4 h-4 text-orange-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{task.title}</p>
                                    {task.project && (
                                      <p className="text-xs text-slate-500 truncate">{task.project.name}</p>
                                    )}
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[task.status] || "bg-slate-100 text-slate-600"}`}>
                                    {statusLabels[task.status] || task.status}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Users */}
                          {searchResults?.users.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Membres</p>
                              {searchResults.users.map((user) => (
                                <button
                                  key={user.id}
                                  onClick={() => handleResultClick(`/directory`)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-all text-left group"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {(user.name || user.email).substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{user.name || user.email}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.jobTitle || user.email}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />

              {/* Profile Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-slate-100/80 transition-all border border-transparent hover:border-slate-200"
                >
                  {/* Avatar in header — uses local API-fresh state */}
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    {userImage && (userImage.startsWith('http') || userImage.startsWith('data:image')) ? (
                      <img src={userImage} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-black">
                        {(userName || session?.user?.name || session?.user?.email || '?').substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-slate-900 leading-none">
                      {(userName || session?.user?.name)?.split(" ")[0]}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">
                      {session.user?.role || "Membre"}
                    </p>
                  </div>
                </motion.button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                      >
                        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mon Compte</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{session.user?.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <User className="w-4 h-4" /> Profil
                          </Link>
                          <Link
                            href="/settings"
                            onClick={() => setIsProfileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Settings className="w-4 h-4" /> Paramètres
                          </Link>
                          <div className="my-2 border-t border-slate-100" />
                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <LogOut className="w-4 h-4" /> Déconnexion
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                aria-label="Menu"
              >
                {isSidebarOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
              </button>
            </div>
          </div>
        </div>

      </motion.header>

      {/* Spacer */}
      <div className="h-20" />
    </>
  );
}

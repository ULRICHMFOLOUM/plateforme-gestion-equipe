"use client";
/**
 * Page : Annuaire de l'Équipe — Refonte Complète
 * Vues : Grille · Liste · Organigramme
 * Actions : Chat direct · Visio · Assigner tâche · Voir planning · Profil slide-over
 */
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, UserPlus, X, Bell, CheckCircle, XCircle,
  Trash2, ArrowLeft, Users, Video, CheckSquare, Calendar, Mail,
  Building2, Briefcase, Star, Grid3X3, List, GitBranch, Loader2,
  Phone, Globe, ChevronDown, ChevronRight, Send,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import UserAvatar from "@/components/ui/UserAvatar";
import { showToast } from "@/components/ui/Toast";

interface Contact {
  id: string;
  contactId: string;
  name: string;
  email: string;
  image?: string | null;
  status: "online" | "away" | "busy" | "offline";
  isFavorite: boolean;
  jobTitle?: string;
  department?: string;
  phone?: string;
  bio?: string;
  timezone?: string;
}

interface ContactRequest {
  id: string;
  senderId?: string;
  receiverId?: string;
  name: string;
  email: string;
  image?: string | null;
  message?: string;
  createdAt: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  jobTitle?: string;
  department?: string;
}

type ViewMode = "grid" | "list" | "org";
type FilterType = "all" | "online" | "favorites";

// ──────────────────────────────────────────────────────────
// Contact Profile Slide-Over Panel
// ──────────────────────────────────────────────────────────
function ContactProfilePanel({
  contact,
  onClose,
  onChat,
  onVideo,
  onAssignTask,
  onRemove,
}: {
  contact: Contact;
  onClose: () => void;
  onChat: (c: Contact) => void;
  onVideo: (c: Contact) => void;
  onAssignTask: (c: Contact) => void;
  onRemove: (c: Contact) => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col"
      >
        {/* Hero section */}
        <div className="relative h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Avatar — no extra frame, flush to card */}
          <div className="absolute -bottom-14 left-6">
            <div className="w-28 h-28 rounded-3xl overflow-hidden ring-4 ring-white shadow-2xl">
              <UserAvatar
                user={contact}
                size="2xl"
                className="w-full h-full"
              />
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white shadow-lg ${
                contact.status === "online"
                  ? "bg-emerald-500"
                  : contact.status === "away"
                  ? "bg-amber-500"
                  : contact.status === "busy"
                  ? "bg-red-500"
                  : "bg-slate-400"
              }`}
            />
          </div>
        </div>

        {/* Info */}
        <div className="pt-16 px-6 pb-6 flex-1">
          <h2 className="text-2xl font-black text-slate-900">{contact.name}</h2>
          {contact.jobTitle && (
            <p className="text-sm font-bold text-blue-600 mt-0.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> {contact.jobTitle}
            </p>
          )}
          {contact.department && (
            <p className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> {contact.department}
            </p>
          )}

          {/* Contact Info */}
          <div className="mt-6 space-y-2.5">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <a href={`mailto:${contact.email}`} className="font-medium hover:text-blue-600 transition-colors">
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-medium">{contact.phone}</span>
              </div>
            )}
            {contact.timezone && (
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-medium">{contact.timezone}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {contact.bio && (
            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{contact.bio}"</p>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => onChat(contact)}
              className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl active:scale-95"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              Envoyer un message
            </button>
            <button
              onClick={() => onVideo(contact)}
              className="flex items-center justify-center gap-2 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-violet-500/25 hover:shadow-xl active:scale-95"
            >
              <Video className="w-4.5 h-4.5" />
              Démarrer visio
            </button>
            <button
              onClick={() => onAssignTask(contact)}
              className="flex items-center justify-center gap-2 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl font-bold text-sm transition-all border border-emerald-200 active:scale-95"
            >
              <CheckSquare className="w-4.5 h-4.5" />
              Assigner une tâche
            </button>
            <button
              onClick={() => router.push(`/calendar`)}
              className="flex items-center justify-center gap-2 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl font-bold text-sm transition-all border border-amber-200 active:scale-95"
            >
              <Calendar className="w-4.5 h-4.5" />
              Voir le planning
            </button>
          </div>

          {/* Danger Zone */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => onRemove(contact)}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold text-sm transition-all border border-red-100 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Retirer de mes contacts
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Assign Task Mini Modal
// ──────────────────────────────────────────────────────────
function AssignTaskModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, dueDate: dueDate || null, assigneeId: contact.contactId }),
      });
      if (res.ok) {
        showToast({ type: "success", title: "Tâche assignée !", message: `"${title}" a été assignée à ${contact.name}.` });
        onClose();
      } else {
        showToast({ type: "error", title: "Erreur", message: "Impossible de créer la tâche." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">Assigner une tâche</h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">à {contact.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Titre de la tâche *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Réviser les spécifications du projet"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl font-medium text-sm outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl font-medium text-sm outline-none"
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl font-medium text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:shadow-xl"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckSquare className="w-5 h-5" />Créer et assigner</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main Page Component
// ──────────────────────────────────────────────────────────
let router: ReturnType<typeof useRouter>;

export default function DirectoryPage() {
  const { data: session, status } = useSession();
  router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status]);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ContactRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Modals & panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAssignTask, setShowAssignTask] = useState<Contact | null>(null);

  // Add contact search state
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [addSearchResults, setAddSearchResults] = useState<SearchResult[]>([]);
  const [addSearchLoading, setAddSearchLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [pendingInvite, setPendingInvite] = useState<SearchResult | null>(null);

  const searchTimeout = useRef<NodeJS.Timeout>();

  const fetchData = async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setReceivedRequests(data.receivedRequests || []);
        setSentRequests(data.sentRequests || []);
      }
    } catch (e) {
      console.error("Erreur:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status]);

  // Real-time search as user types in add modal
  const handleAddSearch = (q: string) => {
    setAddSearchQuery(q);
    setPendingInvite(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setAddSearchResults([]); return; }

    setAddSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "search", email: q }),
        });
        if (res.ok) {
          const data = await res.json();
          setAddSearchResults(data);
        }
      } finally {
        setAddSearchLoading(false);
      }
    }, 300);
  };

  const handleSendRequest = async () => {
    if (!pendingInvite || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendRequest", userId: pendingInvite.id, message: inviteMessage }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", title: "Erreur", message: data.error });
      } else {
        showToast({ type: "success", title: "Invitation envoyée !", message: `${pendingInvite.name} recevra votre demande sous peu.` });
        setSentRequests(prev => [...prev, { id: data.id, receiverId: pendingInvite.id, name: pendingInvite.name, email: pendingInvite.email, image: pendingInvite.image, message: inviteMessage, createdAt: new Date().toISOString() }]);
        setShowAddModal(false);
        setAddSearchQuery("");
        setAddSearchResults([]);
        setPendingInvite(null);
        setInviteMessage("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequest = async (r: ContactRequest) => {
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acceptRequest", userId: r.senderId || r.email }),
      });
      if (res.ok) {
        setReceivedRequests(prev => prev.filter(x => x.id !== r.id));
        fetchData();
        showToast({ type: "success", title: "Contact ajouté !", message: `${r.name} est maintenant dans votre annuaire.` });
      }
    } catch (e) { console.error(e); }
  };

  const handleRejectRequest = async (r: ContactRequest) => {
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rejectRequest", userId: r.senderId || r.email }),
      });
      if (res.ok) {
        setReceivedRequests(prev => prev.filter(x => x.id !== r.id));
        showToast({ type: "info", title: "Demande refusée", message: `La demande de ${r.name} a été déclinée.` });
      }
    } catch (e) { console.error(e); }
  };

  const handleRemoveContact = async (contact: Contact) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/contacts?contactId=${contact.contactId}`, { method: "DELETE" });
      if (res.ok) {
        setContacts(prev => prev.filter(c => c.contactId !== contact.contactId));
        setSelectedContact(null);
        showToast({ type: "warning", title: "Contact retiré", message: `${contact.name} a été retiré de vos contacts.` });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChat = (contact: Contact) => {
    router.push(`/chat?contactId=${contact.contactId}`);
  };

  const handleVideo = (contact: Contact) => {
    router.push(`/video`);
  };

  // Departments for org view
  const departments = ["all", ...Array.from(new Set(contacts.map(c => c.department || "Sans département")))];

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.jobTitle || "").toLowerCase().includes(q) ||
      (c.department || "").toLowerCase().includes(q);
    const matchesStatus =
      activeFilter === "all" ||
      (activeFilter === "online" && c.status === "online") ||
      (activeFilter === "favorites" && c.isFavorite);
    const matchesDept = departmentFilter === "all" || (c.department || "Sans département") === departmentFilter;
    return matchesQuery && matchesStatus && matchesDept;
  });

  // Group by department for org view
  const byDept = filteredContacts.reduce<Record<string, Contact[]>>((acc, c) => {
    const dept = c.department || "Sans département";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(c);
    return acc;
  }, {});

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <DashboardWrapper>
      <div className="relative space-y-8 pb-16">
        {/* Background glows */}
        <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-400/8 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-400/8 blur-[150px] rounded-full pointer-events-none -z-10" />

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => router.back()}
              className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm transition-all text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
                Annuaire <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Équipe</span>
              </h1>
              <p className="text-slate-500 mt-1.5 font-medium text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{contacts.length} contact{contacts.length > 1 ? "s" : ""}</span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600 font-bold">{contacts.filter(c => c.status === "online").length} en ligne</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-1 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              {([["grid", Grid3X3], ["list", List], ["org", GitBranch]] as [ViewMode, any][]).map(([mode, Icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-xl transition-all ${viewMode === mode ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
                  title={mode === "grid" ? "Grille" : mode === "list" ? "Liste" : "Organigramme"}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Requests */}
            <button
              onClick={() => setShowRequestsPanel(true)}
              className="relative p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm transition-all text-slate-600"
            >
              <Bell className="w-5 h-5" />
              {receivedRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {receivedRequests.length}
                </span>
              )}
            </button>

            {/* Add contact */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un contact
            </button>
          </div>
        </div>

        {/* ── Search & Filters ── */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, poste, département..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <div className="flex gap-1 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              {(["all", "online", "favorites"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {f === "all" ? "Tous" : f === "online" ? "🟢 En ligne" : "⭐ Favoris"}
                </button>
              ))}
            </div>

            {/* Department filter */}
            {departments.length > 2 && (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none shadow-sm"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d === "all" ? "Tous les départements" : d}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ── Contact Grid View ── */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredContacts.map((contact) => (
                <motion.div
                  key={contact.contactId}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ContactGridCard
                    contact={contact}
                    onOpenProfile={() => setSelectedContact(contact)}
                    onChat={() => handleChat(contact)}
                    onVideo={() => handleVideo(contact)}
                    onAssignTask={() => setShowAssignTask(contact)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Contact List View ── */}
        {viewMode === "list" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-[1fr_1fr_120px_180px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Contact</span>
              <span>Poste</span>
              <span>Statut</span>
              <span>Actions</span>
            </div>
            <AnimatePresence>
              {filteredContacts.map((contact, idx) => (
                <motion.div
                  key={contact.contactId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="grid grid-cols-[1fr_1fr_120px_180px] gap-4 px-6 py-4 border-b border-slate-100 hover:bg-blue-50/30 transition-colors items-center cursor-pointer"
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar user={contact} size="sm" showStatus={true} status={contact.status} />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{contact.name}</p>
                      <p className="text-xs text-slate-400 truncate">{contact.email}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{contact.jobTitle || "—"}</p>
                    <p className="text-xs text-slate-400 truncate">{contact.department || ""}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black ${contact.status === "online" ? "bg-emerald-50 text-emerald-700" : contact.status === "away" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${contact.status === "online" ? "bg-emerald-500" : contact.status === "away" ? "bg-amber-500" : "bg-slate-400"}`} />
                      {contact.status === "online" ? "En ligne" : contact.status === "away" ? "Absent" : "Hors ligne"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleChat(contact)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all" title="Chat"><MessageSquare className="w-4 h-4" /></button>
                    <button onClick={() => handleVideo(contact)} className="p-2 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl transition-all" title="Visio"><Video className="w-4 h-4" /></button>
                    <button onClick={() => setShowAssignTask(contact)} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all" title="Tâche"><CheckSquare className="w-4 h-4" /></button>
                    <button onClick={() => { if (window.confirm(`Retirer ${contact.name} ?`)) handleRemoveContact(contact); }} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Org Chart View ── */}
        {viewMode === "org" && (
          <div className="space-y-8">
            {Object.entries(byDept).map(([dept, members]) => (
              <motion.div
                key={dept}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{dept}</h3>
                    <p className="text-xs font-bold text-slate-400">{members.length} membre{members.length > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  {members.map((contact) => (
                    <button
                      key={contact.contactId}
                      onClick={() => setSelectedContact(contact)}
                      className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all group"
                    >
                      <UserAvatar user={contact} size="sm" showStatus={true} status={contact.status} />
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{contact.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{contact.jobTitle || contact.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filteredContacts.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">Aucun contact trouvé</h3>
            <p className="text-slate-500 font-medium mt-2 max-w-xs">
              {searchQuery ? `Aucun résultat pour "${searchQuery}"` : "Ajoutez vos premiers collaborateurs pour agrandir votre réseau."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <UserPlus className="w-4 h-4" /> Ajouter un contact
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Profile Slide-Over ── */}
      <AnimatePresence>
        {selectedContact && (
          <ContactProfilePanel
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onChat={(c) => { setSelectedContact(null); handleChat(c); }}
            onVideo={(c) => { setSelectedContact(null); handleVideo(c); }}
            onAssignTask={(c) => { setSelectedContact(null); setShowAssignTask(c); }}
            onRemove={(c) => handleRemoveContact(c)}
          />
        )}
      </AnimatePresence>

      {/* ── Assign Task Modal ── */}
      <AnimatePresence>
        {showAssignTask && (
          <AssignTaskModal contact={showAssignTask} onClose={() => setShowAssignTask(null)} />
        )}
      </AnimatePresence>

      {/* ── Add Contact Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Ajouter un contact</h2>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">Recherchez un membre de la plateforme</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
              </div>

              {/* Real-time search */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  value={addSearchQuery}
                  onChange={(e) => handleAddSearch(e.target.value)}
                  placeholder="Nom ou adresse email..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none transition-all"
                  autoFocus
                />
                {addSearchLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />}
              </div>

              {/* Search results */}
              {addSearchResults.length > 0 && !pendingInvite && (
                <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
                  {addSearchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setPendingInvite(u); setAddSearchResults([]); }}
                      className="w-full flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all text-left group"
                    >
                      <UserAvatar user={u} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.jobTitle ? `${u.jobTitle} · ` : ""}{u.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}

              {addSearchQuery.length >= 2 && addSearchResults.length === 0 && !addSearchLoading && !pendingInvite && (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-sm font-bold">Aucun utilisateur trouvé pour "{addSearchQuery}"</p>
                  <p className="text-xs mt-1">Vérifiez l'email ou le nom complet</p>
                </div>
              )}

              {/* Selected user to invite */}
              {pendingInvite && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                    <UserAvatar user={pendingInvite} size="md" />
                    <div className="flex-1">
                      <p className="font-black text-slate-900">{pendingInvite.name}</p>
                      <p className="text-xs text-slate-500">{pendingInvite.email}</p>
                    </div>
                    <button onClick={() => { setPendingInvite(null); setAddSearchQuery(""); }} className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Message personnel (optionnel)</label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      placeholder="Bonjour, je vous ajoute à mon réseau collaboratif..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none resize-none transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSendRequest}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/25 disabled:opacity-50 transition-all hover:shadow-2xl active:scale-98"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" />Envoyer l'invitation</>}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Requests Panel ── */}
      <AnimatePresence>
        {showRequestsPanel && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowRequestsPanel(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Demandes en attente</h3>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">{receivedRequests.length} demande{receivedRequests.length > 1 ? "s" : ""} reçue{receivedRequests.length > 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => setShowRequestsPanel(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {receivedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-16">
                    <Bell className="w-12 h-12 opacity-20 mb-3" />
                    <p className="font-bold text-sm">Aucune demande en attente</p>
                    <p className="text-xs mt-1">Vous recevrez vos invitations ici</p>
                  </div>
                ) : (
                  receivedRequests.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <UserAvatar user={{ name: r.name, image: r.image }} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                          <p className="text-xs text-slate-400">{r.email}</p>
                          {r.message && <p className="text-xs text-slate-600 font-medium mt-1.5 italic">"{r.message}"</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(r)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/20"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Accepter
                        </button>
                        <button
                          onClick={() => handleRejectRequest(r)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-black rounded-xl transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Refuser
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Sent requests */}
              {sentRequests.length > 0 && (
                <div className="p-4 border-t border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Invitations envoyées</p>
                  <div className="space-y-2">
                    {sentRequests.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <UserAvatar user={{ name: r.name, image: r.image }} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{r.name}</p>
                          <p className="text-[10px] text-slate-400">En attente de réponse</p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardWrapper>
  );
}

// ──────────────────────────────────────────────────────────
// Contact Grid Card with flip-on-hover effect
// ──────────────────────────────────────────────────────────
function ContactGridCard({
  contact,
  onOpenProfile,
  onChat,
  onVideo,
  onAssignTask,
}: {
  contact: Contact;
  onOpenProfile: () => void;
  onChat: () => void;
  onVideo: () => void;
  onAssignTask: () => void;
}) {
  const statusColor = {
    online: "bg-emerald-500",
    away: "bg-amber-500",
    busy: "bg-red-500",
    offline: "bg-slate-400",
  }[contact.status] || "bg-slate-400";

  const statusLabel = {
    online: "En ligne",
    away: "Absent",
    busy: "Occupé",
    offline: "Hors ligne",
  }[contact.status] || "Hors ligne";

  return (
    <div className="group relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* Card top colored band */}
      <div className="h-24 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-2 right-2 w-20 h-20 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-full bg-white/5" />
        </div>
      </div>

      {/* Avatar — positioned over the color band, no wrapper frame */}
      <div className="absolute top-10 left-5">
        <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl">
          <UserAvatar user={contact} size="xl" className="w-full h-full !rounded-none" />
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${statusColor}`} title={statusLabel} />
      </div>

      {/* Body */}
      <div className="pt-6 pb-5 px-5">
        <div className="mb-4">
          <button onClick={onOpenProfile} className="text-left w-full">
            <h3 className="text-lg font-black text-slate-900 hover:text-blue-600 transition-colors leading-tight">{contact.name}</h3>
            <p className="text-xs font-bold text-blue-600 mt-0.5">{contact.jobTitle || " "}</p>
            {contact.department && (
              <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {contact.department}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{contact.email}</p>
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100">
          <button
            onClick={onChat}
            className="flex flex-col items-center gap-1.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all group/btn"
            title="Envoyer un message"
          >
            <MessageSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            <span className="text-[8px] font-black uppercase">Chat</span>
          </button>
          <button
            onClick={onVideo}
            className="flex flex-col items-center gap-1.5 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-600 rounded-xl transition-all group/btn"
            title="Démarrer une visio"
          >
            <Video className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            <span className="text-[8px] font-black uppercase">Visio</span>
          </button>
          <button
            onClick={onAssignTask}
            className="flex flex-col items-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all group/btn"
            title="Assigner une tâche"
          >
            <CheckSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            <span className="text-[8px] font-black uppercase">Tâche</span>
          </button>
          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all group/btn"
            title="Voir le profil complet"
          >
            <Users className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            <span className="text-[8px] font-black uppercase">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
}

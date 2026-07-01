"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Plus,
  ArrowLeft,
  Play,
  Share2,
  Clock,
  User,
  X,
  Video as VideoIcon,
  Copy,
  Check,
  Link2,
  ExternalLink,
  Mail,
  MessageSquare,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import UserAvatar from "@/components/ui/UserAvatar";

interface Conference {
  id: string;
  title: string;
  description?: string;
  roomId: string;
  startTime: string;
  endTime?: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  hostId: string;
  host: {
    name?: string;
    email: string;
    image?: string;
  };
}

// ─── Share Modal ──────────────────────────────────────────────────────────────
function ShareModal({ conference, onClose }: { conference: Conference; onClose: () => void }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/video/join/${conference.roomId}`;
  const jitsiUrl = `https://meet.jit.si/${conference.roomId}`;

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/chat/rooms");
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
      }
    };
    fetchRooms();
  }, []);

  const handleShareToChat = async () => {
    if (!selectedRoom) return;
    setIsSharing(true);
    try {
      const message = `Bonjour,\n\nJe vous invite à rejoindre la visioconférence "${conference.title}".\n\nLien de participation :\n${joinUrl}`;
      const res = await fetch(`/api/chat/rooms/${selectedRoom}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      if (res.ok) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error sharing to chat:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async (text: string, type: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(type);
      setTimeout(() => setCopied(null), 2500);
    }
  };

  const mailtoLink = `mailto:?subject=Invitation à rejoindre "${conference.title}"&body=Bonjour,%0A%0AVous êtes invité(e) à rejoindre la visioconférence "%0A%0ATitre: ${encodeURIComponent(conference.title)}%0ADate: ${new Date(conference.startTime).toLocaleString("fr-FR")}%0A%0ALien de participation:%0A${encodeURIComponent(joinUrl)}%0A%0AOu rejoignez directement via Jit.si:%0A${encodeURIComponent(jitsiUrl)}`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-display font-black text-slate-900">Partager la réunion</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5 truncate max-w-xs">
              {conference.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Invite link & Jitsi code */}
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                Lien d'invitation
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 rounded-2xl p-3">
                <Link2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="flex-1 text-sm font-bold text-slate-600 truncate">{joinUrl}</span>
                <button
                  onClick={() => copyToClipboard(joinUrl, "link")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    copied === "link"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                  }`}
                >
                  {copied === "link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === "link" ? "Copié" : "Copier"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                Code Jit.si direct
              </label>
              <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 rounded-2xl p-3">
                <code className="flex-1 text-sm font-mono font-black text-slate-900 truncate">{conference.roomId}</code>
                <button
                  onClick={() => copyToClipboard(conference.roomId, "code")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    copied === "code"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                  }`}
                >
                  {copied === "code" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied === "code" ? "Copié" : "Copier"}
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Share to Chat */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Partager dans un salon
            </label>
            <div className="flex gap-2">
              <select 
                value={selectedRoom} 
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-700 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Choisir une discussion...</option>
                {rooms.map((room: any) => (
                  <option key={room.id} value={room.id}>
                    {room.name} {room.type === 'GROUP' ? '👥' : '👤'}
                  </option>
                ))}
              </select>
              <button
                onClick={handleShareToChat}
                disabled={!selectedRoom || isSharing}
                className="px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 disabled:opacity-50 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center min-w-[120px]"
              >
                {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer"}
              </button>
            </div>
            {shareSuccess && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                <Check className="w-3 h-3" /> Invitation envoyée !
              </motion.p>
            )}
          </div>

          {/* External Actions */}
          <div className="grid grid-cols-2 gap-4 pt-2 flex-shrink-0">
            <a
              href={mailtoLink}
              className="flex items-center justify-center gap-3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
            <a
              href={jitsiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-4 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Jitsi Direct
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
// ─── Main Content ─────────────────────────────────────────────────────────────
function VideoPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [sharingConference, setSharingConference] = useState<Conference | null>(null);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [newConference, setNewConference] = useState({
    title: "",
    description: "",
    startTime: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    fetchConferences();
  }, [projectId, status, session]);

  const fetchConferences = async () => {
    try {
      const url = projectId ? `/api/video?projectId=${projectId}` : "/api/video";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setConferences(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des conférences:", error);
    }
  };

  const handleCreateConference = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newConference,
          startTime: new Date(newConference.startTime).toISOString(),
          projectId: projectId || undefined,
        }),
      });
      if (response.ok) {
        const conference = await response.json();
        setConferences((prev) => [conference, ...prev]);
        setIsCreating(false);
        setNewConference({ title: "", description: "", startTime: "" });
        setSharingConference(conference);
      }
    } catch (error) {
      console.error("Erreur lors de la création:", error);
    }
  };

  const handleJoinConference = (conference: Conference) => {
    window.open(`https://meet.jit.si/${conference.roomId}`, "_blank");
  };

  if (status === "loading") return <LoadingScreen />;
  if (status === "unauthenticated" || !session) return null;

  return (
    <DashboardWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-3 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
                Visioconférence
              </h1>
              <p className="text-slate-500 mt-2 font-medium">
                {projectId ? "Réunions de projet • Haute qualité" : "Collaborez en temps réel avec votre équipe"}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            className="rounded-2xl shadow-xl shadow-blue-500/20"
            onClick={() => setIsCreating(true)}
            icon={Plus}
          >
            Nouvelle réunion
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={Video} label="Réunions en cours" value={conferences.filter((c) => c.status === "ONGOING").length} color="green" />
          <StatCard icon={Clock} label="Programmées" value={conferences.filter((c) => c.status === "SCHEDULED").length} color="blue" />
          <StatCard icon={User} label="Total" value={conferences.length} color="purple" />
        </div>

        {/* Create Modal */}
        <AnimatePresence>
          {isCreating && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden border border-white/50"
              >
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-display font-black text-slate-900">
                      Organiser une réunion
                    </h3>
                    <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateConference} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Titre de la réunion</label>
                      <input
                        type="text"
                        required
                        value={newConference.title}
                        onChange={(e) => setNewConference((p) => ({ ...p, title: e.target.value }))}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-6 text-lg font-medium transition-all"
                        placeholder="ex: Design Review Q4"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Description</label>
                      <textarea
                        value={newConference.description}
                        onChange={(e) => setNewConference((p) => ({ ...p, description: e.target.value }))}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-6 text-lg font-medium transition-all min-h-[100px] resize-none"
                        placeholder="Ordre du jour..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Date et heure</label>
                      <input
                        type="datetime-local"
                        required
                        value={newConference.startTime}
                        onChange={(e) => setNewConference((p) => ({ ...p, startTime: e.target.value }))}
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-6 text-lg font-medium transition-all"
                      />
                    </div>
                    <div className="pt-4 flex gap-4">
                      <Button variant="ghost" className="flex-1 rounded-2xl" onClick={() => setIsCreating(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" variant="primary" className="flex-1 rounded-2xl shadow-xl shadow-blue-500/30">
                        Créer &amp; Partager
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {sharingConference && (
            <ShareModal conference={sharingConference} onClose={() => setSharingConference(null)} />
          )}
        </AnimatePresence>

        {/* Conferences Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {conferences.map((conf) => (
            <motion.div
              layout
              key={conf.id}
              className="group relative bg-white border border-slate-100 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all"
            >
              <div className="absolute top-6 right-8">
                <span
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                    conf.status === "ONGOING"
                      ? "bg-emerald-500 text-white animate-pulse"
                      : conf.status === "SCHEDULED"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {conf.status === "ONGOING" ? "En direct" : conf.status === "SCHEDULED" ? "Prévu" : conf.status}
                </span>
              </div>

              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                  <VideoIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{conf.title}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">
                    Hôte • {conf.host.name || conf.host.email}
                  </p>
                </div>
              </div>

              <p className="text-slate-500 mb-6 line-clamp-2 min-h-[2.5rem] font-medium leading-relaxed">
                {conf.description || "Aucune description fournie pour cette réunion."}
              </p>

              <div className="flex items-center justify-between py-5 border-y border-slate-50 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {new Date(conf.startTime).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {/* Copy code quick action */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(conf.roomId);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all"
                  title="Copier le code de réunion"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Code
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleJoinConference(conf)}
                  className="flex-1 bg-slate-900 hover:bg-black text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Rejoindre
                </button>
                <button
                  onClick={() => setSharingConference(conf)}
                  className="p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl transition-all active:scale-95"
                  title="Partager l'invitation"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {conferences.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
              <VideoIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-display font-black text-slate-900">Aucune réunion</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">
              Programmez votre première visioconférence pour collaborer avec votre équipe.
            </p>
            <Button variant="primary" icon={Plus} className="mt-6" onClick={() => setIsCreating(true)}>
              Nouvelle réunion
            </Button>
          </div>
        )}
      </div>
    </DashboardWrapper>
  );
}

export default function VideoPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <VideoPageContent />
    </Suspense>
  );
}

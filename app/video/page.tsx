"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Plus, ArrowLeft, Play, Share2, Clock, User, X,
  Video as VideoIcon, Copy, Check, Link2, ExternalLink, Mail,
  MessageSquare, Loader2, Mic, MicOff, PhoneCall, Shield, Sparkles,
  Users, Lock, AlertCircle, Eye,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import { StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

interface Conference {
  id: string;
  title: string;
  description?: string;
  roomId: string;
  startTime: string;
  endTime?: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  hostId: string;
  mode?: "VIDEO" | "AUDIO";
  host: {
    name?: string;
    email: string;
    image?: string;
  };
}

// ── Share Modal ───────────────────────────────────────────
function ShareModal({ conference, onClose }: { conference: Conference; onClose: () => void }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/video/join/${conference.roomId}` : "";
  const jitsiUrl = `https://meet.jit.si/${conference.roomId}`;

  useEffect(() => {
    fetch("/api/chat/rooms")
      .then((res) => (res.ok ? res.json() : []))
      .then(setRooms)
      .catch(console.error);
  }, []);

  const handleShareToChat = async () => {
    if (!selectedRoom) return;
    setIsSharing(true);
    try {
      const message = `🎥 Invitation à la réunion "${conference.title}" (${conference.mode === "AUDIO" ? "Appel Vocal" : "Visioconférence"})\n\n👉 Rejoindre : ${joinUrl}`;
      const res = await fetch(`/api/chat/rooms/${selectedRoom}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message }),
      });
      if (res.ok) {
        showToast({ type: "success", title: "Invitation partagée dans le chat !" });
        onClose();
      }
    } finally {
      setIsSharing(false);
    }
  };

  const copyText = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    showToast({ type: "success", title: type === "link" ? "Lien copié !" : "Code copié !" });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 z-10 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">Partager l'invitation</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{conference.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>

        {/* Link box */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Lien direct de réunion</label>
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl">
            <Link2 className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-700 truncate flex-1">{joinUrl}</span>
            <button
              onClick={() => copyText(joinUrl, "link")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all"
            >
              {copied === "link" ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>

        {/* Chat share */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Partager dans un salon de chat</label>
          <div className="flex gap-2">
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none"
            >
              <option value="">Sélectionner une discussion...</option>
              {rooms.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <button
              onClick={handleShareToChat}
              disabled={!selectedRoom || isSharing}
              className="px-5 py-3 bg-slate-900 text-white font-black text-xs rounded-2xl hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer"}
            </button>
          </div>
        </div>

        {/* Direct Jitsi button */}
        <a
          href={jitsiUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-black text-xs rounded-2xl border border-violet-200 transition-all"
        >
          <ExternalLink className="w-4 h-4" /> Lien direct Jitsi Meet
        </a>
      </motion.div>
    </div>
  );
}

// ── Main Page Content ─────────────────────────────────────
function VideoPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [conferences, setConferences] = useState<Conference[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sharingConf, setSharingConf] = useState<Conference | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [mode, setMode] = useState<"VIDEO" | "AUDIO">("VIDEO");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const fetchConferences = async () => {
    try {
      const url = projectId ? `/api/video?projectId=${projectId}` : "/api/video";
      const res = await fetch(url);
      if (res.ok) setConferences(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session) fetchConferences();
  }, [status, session, projectId]);

  // Anti-duplication protected create handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
          projectId: projectId || undefined,
          mode,
        }),
      });

      if (res.ok) {
        const conf = await res.json();
        setConferences((prev) => [conf, ...prev]);
        setIsCreating(false);
        setTitle("");
        setDescription("");
        setStartTime("");
        setSharingConf(conf);
        showToast({ type: "success", title: "Réunion créée !", message: conf.title });
      } else {
        showToast({ type: "error", title: "Erreur lors de la création" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = (conf: Conference) => {
    router.push(`/video/join/${conf.roomId}`);
  };

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  return (
    <DashboardWrapper>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm text-slate-600 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
                Visioconférence <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">HD</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {conferences.length} réunion{conferences.length > 1 ? "s" : ""} · Appel vidéo HD, appel vocal, partage d'écran & enregistrement
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all active:scale-95"
          >
            <Plus className="w-4.5 h-4.5" /> Programmer une réunion
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={Video} label="Réunions en cours" value={conferences.filter((c) => c.status === "ONGOING").length} color="green" />
          <StatCard icon={Clock} label="Programmées" value={conferences.filter((c) => c.status === "SCHEDULED").length} color="blue" />
          <StatCard icon={User} label="Total réunions" value={conferences.length} color="purple" />
        </div>

        {/* Conferences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {conferences.map((conf) => (
              <motion.div
                layout
                key={conf.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${conf.status === "ONGOING" ? "bg-emerald-500 text-white animate-pulse" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                      {conf.status === "ONGOING" ? "🔴 En direct" : "Prévu"}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 flex items-center gap-1">
                      {conf.mode === "AUDIO" ? <PhoneCall className="w-3 h-3 text-amber-500" /> : <VideoIcon className="w-3 h-3 text-blue-500" />}
                      {conf.mode === "AUDIO" ? "Vocal" : "Vidéo HD"}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${conf.mode === "AUDIO" ? "bg-amber-500 text-white" : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"}`}>
                      {conf.mode === "AUDIO" ? <PhoneCall className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{conf.title}</h3>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">par {conf.host.name || conf.host.email}</p>
                    </div>
                  </div>

                  {conf.description && <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2">{conf.description}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pt-4 border-t border-slate-100 mb-4">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {new Date(conf.startTime).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoin(conf)}
                      className="flex-1 py-3 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" /> Rejoindre
                    </button>
                    <button
                      onClick={() => setSharingConf(conf)}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
                      title="Partager"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {conferences.length === 0 && (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoIcon className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-800">Aucune visioconférence</h3>
            <p className="text-slate-500 font-medium text-sm mt-1">Programmez votre première réunion pour collaborer avec l'équipe.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setIsCreating(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 z-10 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900">Nouvelle Réunion</h3>
                <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setMode("VIDEO")}
                  className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${mode === "VIDEO" ? "bg-white text-blue-600 shadow-md" : "text-slate-500"}`}
                >
                  <VideoIcon className="w-4 h-4" /> Visioconférence
                </button>
                <button
                  type="button"
                  onClick={() => setMode("AUDIO")}
                  className={`py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${mode === "AUDIO" ? "bg-white text-amber-600 shadow-md" : "text-slate-500"}`}
                >
                  <PhoneCall className="w-4 h-4" /> Appel Vocal
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Titre de la réunion *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Synchronisation Hebdomadaire"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Description (optionnel)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ordre du jour, préparatifs..."
                    rows={2}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Date et heure</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  {isSubmitting ? "Création en cours..." : "Créer et obtenir le lien"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {sharingConf && (
          <ShareModal conference={sharingConf} onClose={() => setSharingConf(null)} />
        )}
      </AnimatePresence>
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

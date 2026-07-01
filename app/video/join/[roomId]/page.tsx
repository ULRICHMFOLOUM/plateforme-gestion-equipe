"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Video, Loader2, ExternalLink, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

interface ConferenceInfo {
  id: string;
  title: string;
  description?: string;
  roomId: string;
  startTime: string;
  status: string;
  host: { name?: string; email: string };
}

export default function JoinConferencePage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [conference, setConference] = useState<ConferenceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchConference = async () => {
      try {
        const res = await fetch(`/api/video/join/${roomId}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setConference(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (roomId) fetchConference();
  }, [roomId]);

  const handleJoin = () => {
    setJoining(true);
    window.open(`https://meet.jit.si/${roomId}`, "_blank");
    setTimeout(() => setJoining(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  if (notFound || !conference) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center text-white max-w-md">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Video className="w-10 h-10 text-white/50" />
          </div>
          <h1 className="text-3xl font-black mb-3">Lien invalide</h1>
          <p className="text-white/60 mb-8">Cette réunion n'existe pas ou a expiré.</p>
          <Link href="/video" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold transition-all">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    SCHEDULED: { label: "Prévu", color: "bg-blue-500/20 text-blue-300" },
    ONGOING: { label: "En direct", color: "bg-emerald-500/20 text-emerald-300" },
    COMPLETED: { label: "Terminé", color: "bg-slate-500/20 text-slate-300" },
    CANCELLED: { label: "Annulé", color: "bg-red-500/20 text-red-300" },
  };
  const statusInfo = statusLabel[conference.status] || statusLabel.SCHEDULED;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      {/* Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative w-full max-w-lg"
      >
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl text-white">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Video className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <h1 className="text-2xl font-display font-black leading-tight">{conference.title}</h1>
            </div>
          </div>

          {conference.description && (
            <p className="text-white/70 mb-6 leading-relaxed">{conference.description}</p>
          )}

          <div className="space-y-3 mb-8 bg-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 font-medium">Organisateur</span>
              <span className="font-bold">{conference.host.name || conference.host.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 font-medium">Date</span>
              <span className="font-bold">
                {new Date(conference.startTime).toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long",
                })}{" "}
                à{" "}
                {new Date(conference.startTime).toLocaleTimeString("fr-FR", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60 font-medium">Code de réunion</span>
              <code className="font-mono bg-white/10 px-2 py-1 rounded-lg text-xs">{roomId.substring(0, 12)}…</code>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3 mb-6">
            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-300/80">
              La réunion est hébergée sur <strong>Jit.si</strong> — chiffrement de bout en bout
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/" className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-60 text-white py-3 px-6 rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95"
            >
              {joining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ExternalLink className="w-5 h-5" />
                  Rejoindre la réunion
                </>
              )}
            </button>
          </div>
        </div>

        {/* Jitsi branding note */}
        <p className="text-center text-white/30 text-xs mt-4">
          Propulsé par TeamFlow • Visioconférence via Jit.si
        </p>
      </motion.div>
    </div>
  );
}

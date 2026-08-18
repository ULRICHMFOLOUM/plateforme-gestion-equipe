"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video, Loader2, ExternalLink, ArrowLeft, Shield, Mic, MicOff,
  VideoOff, Monitor, Disc, Sparkles, UserCheck, MessageSquare, Volume2,
} from "lucide-react";
import Link from "next/link";
import { showToast } from "@/components/ui/Toast";

interface ConferenceInfo {
  id: string;
  title: string;
  description?: string;
  roomId: string;
  startTime: string;
  status: string;
  mode?: "VIDEO" | "AUDIO";
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

  // In-call toggles preview & features
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [blurBg, setBlurBg] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(true);

  useEffect(() => {
    const fetchConference = async () => {
      try {
        const res = await fetch(`/api/video/join/${roomId}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setConference(data);
        if (data.mode === "AUDIO") setCamOn(false);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (roomId) fetchConference();
  }, [roomId]);

  const handleJoin = () => {
    if (!recordingConsent) {
      showToast({ type: "warning", title: "Consentement requis", message: "Veuillez accepter les conditions de la réunion pour continuer." });
      return;
    }
    setJoining(true);
    // Launch Jitsi Meet with parameters
    const jitsiUrl = `https://meet.jit.si/${roomId}#config.startWithAudioMuted=${!micOn}&config.startWithVideoMuted=${!camOn}`;
    window.open(jitsiUrl, "_blank");
    setTimeout(() => setJoining(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !conference) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-red-500/10 text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Video className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black mb-2">Réunion introuvable</h1>
          <p className="text-slate-400 text-sm mb-8">Ce lien de réunion est invalide ou la session a été fermée.</p>
          <Link href="/video" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-bold transition-all text-sm">
            <ArrowLeft className="w-4 h-4" /> Retour aux réunions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Glow ambient background */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 blur-[160px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Card Header */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push("/video")} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Salle sécurisée TeamFlows
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight">{conference.title}</h1>
            <p className="text-sm text-slate-400 font-medium mt-1">
              Organisée par <span className="text-white font-bold">{conference.host.name || conference.host.email}</span>
            </p>
          </div>

          {conference.description && (
            <p className="text-xs text-slate-300 font-medium leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
              "{conference.description}"
            </p>
          )}

          {/* WebRTC Controls Pre-join Check */}
          <div className="p-6 bg-slate-900/80 rounded-2xl border border-white/10 space-y-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Réglages audio & vidéo avant de rejoindre</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMicOn(!micOn)}
                  className={`p-3.5 rounded-2xl transition-all ${micOn ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
                >
                  {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <div>
                  <p className="text-sm font-bold">{micOn ? "Microphone Activé" : "Microphone Muet"}</p>
                  <p className="text-[10px] text-slate-400">Entrée audio par défaut</p>
                </div>
              </div>

              {conference.mode !== "AUDIO" && (
                <button
                  type="button"
                  onClick={() => setCamOn(!camOn)}
                  className={`p-3.5 rounded-2xl transition-all ${camOn ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
                >
                  {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Extra options */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBlurBg(!blurBg)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${blurBg ? "bg-violet-500/30 text-violet-300 border border-violet-500/40" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Floutage d'arrière-plan {blurBg ? "Actif" : ""}
              </button>
            </div>
          </div>

          {/* Recording Consent Banner */}
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <input
              type="checkbox"
              id="consent"
              checked={recordingConsent}
              onChange={(e) => setRecordingConsent(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="consent" className="text-xs text-amber-200/90 font-medium cursor-pointer leading-snug">
              J'accepte de participer et confirme mon consentement pour l'enregistrement et les règles de confidentialité de la session.
            </label>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-black text-sm rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {joining ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ExternalLink className="w-5 h-5" /> Rejoindre la salle maintenant
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

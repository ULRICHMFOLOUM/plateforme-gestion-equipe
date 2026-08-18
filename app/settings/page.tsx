"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell, Volume2, VolumeX, Shield, Mail, Smartphone, ArrowLeft,
  CheckCircle2, Loader2, Play, Save, User, Lock, Globe,
} from "lucide-react";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { showToast } from "@/components/ui/Toast";
import {
  SoundType, SOUND_LABELS, playNotificationSound,
  getSavedSoundPreference, saveSoundPreference,
} from "@/lib/audio";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedSound, setSelectedSound] = useState<SoundType>("chime");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [taskNotifs, setTaskNotifs] = useState(true);
  const [mentionNotifs, setMentionNotifs] = useState(true);
  const [videoNotifs, setVideoNotifs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    setSelectedSound(getSavedSoundPreference());
  }, []);

  const handleTestSound = (sound: SoundType) => {
    playNotificationSound(sound);
  };

  const handleSave = () => {
    setIsSaving(true);
    saveSoundPreference(selectedSound);
    setTimeout(() => {
      setIsSaving(false);
      showToast({
        type: "success",
        title: "Paramètres enregistrés !",
        message: "Vos préférences de notification et sonores ont été mises à jour.",
      });
    }, 400);
  };

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  return (
    <DashboardWrapper>
      <div className="space-y-8 pb-16 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 shadow-sm text-slate-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
              Paramètres & <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Préférences</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Personnalisez votre expérience sonore et vos alertes TeamFlows
            </p>
          </div>
        </div>

        {/* Sound Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Son de Notification Internes</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Choisissez l'effet sonore émis lors de chaque alerte ou toast dans l'application.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {(Object.keys(SOUND_LABELS) as SoundType[]).map((soundKey) => (
              <div
                key={soundKey}
                onClick={() => { setSelectedSound(soundKey); handleTestSound(soundKey); }}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedSound === soundKey
                    ? "border-blue-500 bg-blue-50/50 shadow-md"
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedSound === soundKey ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                    {selectedSound === soundKey && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm font-bold text-slate-800">{SOUND_LABELS[soundKey]}</span>
                </div>

                {soundKey !== "none" && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleTestSound(soundKey); }}
                    className="p-2 bg-white hover:bg-slate-100 rounded-xl text-blue-600 shadow-sm border border-slate-200 transition-all active:scale-95"
                    title="Tester le son"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Notification Preferences Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Canaux de Notification</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Choisissez sur quels canaux vous souhaitez être notifié.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { label: "Notifications Push Navigateur / PWA", desc: "Alertes en direct même lorsque l'onglet est fermé", state: pushNotifs, setter: setPushNotifs, icon: Smartphone },
              { label: "Emails de Synthèse", desc: "Pour les invitations d'équipe et rappels importants", state: emailNotifs, setter: setEmailNotifs, icon: Mail },
              { label: "Alertes Tâches & Échéances", desc: "Changement de statut, assignation et rappels", state: taskNotifs, setter: setTaskNotifs, icon: CheckCircle2 },
              { label: "Mentions Chat (@nom)", desc: "Notification lors d'une mention explicite dans le chat", state: mentionNotifs, setter: setMentionNotifs, icon: Bell },
              { label: "Rappels Visioconférence", desc: "Alerte 10 minutes avant le début d'une réunion", state: videoNotifs, setter: setVideoNotifs, icon: Shield },
            ].map(({ label, desc, state, setter, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-400 font-medium">{desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setter(!state)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors flex-shrink-0 ${state ? "bg-blue-600" : "bg-slate-300"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${state ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-60 active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer mes préférences
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardWrapper>
  );
}

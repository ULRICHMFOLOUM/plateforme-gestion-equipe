"use client";

import { useState } from "react";
import ContextDrawer from "./ui/ContextDrawer";
import { Video, Mic, MicOff, VideoOff, PhoneOff, Users, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface ProjectVisioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export default function ProjectVisioDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ProjectVisioDrawerProps) {
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const roomUrl = `https://meet.jit.si/TeamFlow-Project-${projectId}`;

  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Visioconférence HD — ${projectName}`}
      width="w-full sm:w-[600px] lg:w-[800px]"
    >
      <div className="p-6 space-y-6 flex flex-col h-full">
        {/* Banner */}
        <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-black text-sm text-white">Salon de réunion vidéo du projet</h3>
              <p className="text-xs text-rose-100 mt-0.5">Chiffrement end-to-end & qualité HD</p>
            </div>
          </div>
          <Link
            href={`/video?projectId=${projectId}`}
            onClick={onClose}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
          >
            Grand écran <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Video Area */}
        <div className="flex-1 min-h-[420px] bg-slate-900 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center border border-slate-800 shadow-2xl">
          {joined ? (
            <iframe
              src={roomUrl}
              allow="camera; microphone; display-capture; autoplay; clipboard-write"
              className="w-full h-full border-0"
              title="Visioconférence"
            />
          ) : (
            <div className="text-center p-8 max-w-sm space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                <Video className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-white">Rejoindre la réunion</h4>
              <p className="text-xs text-slate-400">
                Vous vous apprêtez à entrer dans le salon vidéo avec les membres de l'équipe <strong className="text-white">{projectName}</strong>.
              </p>

              <button
                onClick={() => setJoined(true)}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black rounded-2xl shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Video className="w-4 h-4" /> Rejoindre la visioconférence
              </button>
            </div>
          )}
        </div>
      </div>
    </ContextDrawer>
  );
}

"use client";

import { motion } from "framer-motion";
import { 
  Video, 
  Clock, 
  Users, 
  Play, 
  PhoneOff, 
  Share2,
  Users2 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VideoConferenceCardProps {
  conference: {
    id: string;
    title: string;
    description?: string;
    roomId: string;
    startTime: string;
    endTime?: string;
    status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
    host: {
      name?: string;
      email: string;
    };
  };
  onJoin: (conference: any) => void;
}

export default function VideoConferenceCard({ conference, onJoin }: VideoConferenceCardProps) {
  const isLive = conference.status === "ONGOING";
  const isScheduled = conference.status === "SCHEDULED";
  const isUpcoming = new Date(conference.startTime) > new Date();

  const getTimeLeft = () => {
    const start = new Date(conference.startTime);
    const now = new Date();
    const diff = start.getTime() - now.getTime();

    if (diff < 0) return "Démarrée";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const statusColors = {
    SCHEDULED: "bg-gradient-to-r from-blue-400 to-cyan-400 text-white",
    ONGOING: "bg-gradient-to-r from-emerald-400 to-green-400 text-white ring-2 ring-emerald-200",
    COMPLETED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="group bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl hover:shadow-3xl transition-all overflow-hidden h-[320px]"
    >
      {/* Status Badge */}
      <div className={`px-4 py-1 rounded-bl-3xl ${statusColors[conference.status]} absolute top-0 left-0 z-10 shadow-lg font-semibold text-xs uppercase tracking-wide`}>
        {conference.status === "ONGOING" ? "EN DIRECT" : conference.status === "SCHEDULED" ? "À VENIR" : conference.status}
      </div>

      {/* Header avec timer */}
      <div className="p-6 pb-2 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isLive ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/25" : "bg-gradient-to-r from-slate-100 to-slate-200"}`}>
              <Video className={`w-6 h-6 ${isLive ? "text-white" : "text-slate-500"}`} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-900 line-clamp-1 group-hover:line-clamp-2">
                {conference.title}
              </h3>
              <p className="text-sm text-slate-500">
                Par {conference.host.name || conference.host.email}
              </p>
            </div>
          </div>

          {/* Timer */}
          {isScheduled && isUpcoming && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-2xl shadow-lg font-mono text-xs"
            >
              <Clock className="w-3 h-3 text-slate-500" />
              {getTimeLeft()}
            </motion.div>
          )}
        </div>

        {conference.description && (
          <p className="text-slate-600 mt-2 line-clamp-2">
            {conference.description}
          </p>
        )}
      </div>

      {/* Participants */}
      <div className="p-6 pt-0">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Users2 className="w-4 h-4" />
          Jusqu'à 100 participants
        </div>

        {/* Join button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="space-y-3"
        >
          <Button
            variant={isLive ? "primary" : "outline"}
            size="lg"
            fullWidth
            className={isLive ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25 hover:shadow-xl" : ""}
            onClick={() => onJoin(conference)}
            disabled={!isLive && !isScheduled}
          >
            {isLive ? (
              <>
                <Users className="w-5 h-5 mr-2" />
                Rejoindre en direct
              </>
            ) : isScheduled ? (
              <>
                <Play className="w-5 h-5 mr-2" />
                Démarrer réunion
              </>
            ) : (
              <>
                <PhoneOff className="w-5 h-5 mr-2" />
                Terminée
              </>
            )}
          </Button>

          {isScheduled && (
            <Button variant="ghost" size="sm" className="justify-start">
              <Share2 className="w-4 h-4 mr-2" />
              Inviter participants
            </Button>
          )}
        </motion.div>
      </div>

      {/* Footer gradient */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
    </motion.div>
  );
}


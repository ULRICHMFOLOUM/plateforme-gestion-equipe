"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User as UserIcon } from "lucide-react";

export interface AvatarUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  avatarUrl?: string | null;
  status?: "online" | "away" | "busy" | "offline" | string | null;
  jobTitle?: string | null;
  department?: string | null;
  role?: string | null;
}

export interface UserAvatarProps {
  user?: AvatarUser | null;
  src?: string | null;
  name?: string | null;
  userId?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  status?: "online" | "away" | "busy" | "offline" | string;
  showStatus?: boolean;
  showName?: boolean;
  subtext?: string | null;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
  "2xl": "w-28 h-28 text-3xl",
};

const statusSizes = {
  xs: "w-2 h-2 border-[1.5px]",
  sm: "w-2.5 h-2.5 border-2",
  md: "w-3 h-3 border-2",
  lg: "w-4 h-4 border-2",
  xl: "w-5 h-5 border-3",
  "2xl": "w-6 h-6 border-4",
};

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  busy: "bg-rose-500",
  offline: "bg-slate-400",
};

// Deterministic gradients based on user identity for consistent avatar colors
const gradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-700",
  "from-purple-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-violet-600 to-purple-800",
  "from-cyan-500 to-blue-700",
  "from-rose-500 to-red-700",
  "from-indigo-500 to-cyan-600",
];

function getGradient(identifier?: string | null): string {
  if (!identifier) return gradients[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// Generate thumbnail size URL for Cloudinary images to improve performance
function optimizeCloudinaryUrl(url: string, size: keyof typeof sizeClasses): string {
  if (!url || !url.includes("res.cloudinary.com") || url.includes("/w_")) {
    return url;
  }
  const pxMap = { xs: 48, sm: 64, md: 96, lg: 160, xl: 240, "2xl": 320 };
  const targetPx = pxMap[size] || 96;
  return url.replace("/upload/", `/upload/c_fill,g_face,w_${targetPx},h_${targetPx},q_auto,f_auto/`);
}

export default function UserAvatar({
  user,
  src,
  name,
  userId,
  size = "md",
  status,
  showStatus = false,
  showName = false,
  subtext,
  className = "",
  onClick,
}: UserAvatarProps) {
  const effectiveSrc = user?.image || user?.avatarUrl || src;
  const effectiveName = user?.name || name || user?.email || "";
  const effectiveId = user?.id || userId || effectiveName || "";
  const effectiveStatus = (user?.status || status || "offline") as keyof typeof statusColors;

  const [localSrc, setLocalSrc] = useState(effectiveSrc);
  const [localName, setLocalName] = useState(effectiveName);

  useEffect(() => {
    setLocalSrc(effectiveSrc);
    setLocalName(effectiveName);
  }, [effectiveSrc, effectiveName]);

  // Real-time listener for profile changes across components
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        if (e.detail.image !== undefined) setLocalSrc(e.detail.image);
        if (e.detail.name !== undefined) setLocalName(e.detail.name);
      }
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  const initials = localName
    ? localName
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const isValidSrc =
    localSrc &&
    (localSrc.startsWith("http") ||
      localSrc.startsWith("data:image") ||
      localSrc.startsWith("/"));

  const avatarUrl = isValidSrc ? optimizeCloudinaryUrl(localSrc!, size) : null;
  const gradientClass = getGradient(effectiveId);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 flex-shrink-0 ${
        onClick ? "cursor-pointer group" : ""
      } ${className}`}
    >
      <div className="relative flex-shrink-0">
        <motion.div
          whileHover={onClick ? { scale: 1.05 } : undefined}
          whileTap={onClick ? { scale: 0.95 } : undefined}
          className={`${sizeClasses[size]} rounded-2xl overflow-hidden shadow-sm border border-white/40 flex items-center justify-center bg-gradient-to-br ${gradientClass} transition-all duration-200`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={localName || "Avatar"}
              className="w-full h-full object-cover"
              onError={() => setLocalSrc(null)}
            />
          ) : (
            <span className="font-extrabold text-white tracking-wider select-none">
              {initials || <UserIcon className="w-1/2 h-1/2 opacity-90" />}
            </span>
          )}
        </motion.div>

        {showStatus && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -bottom-0.5 -right-0.5 rounded-full ${
              statusSizes[size]
            } border-white shadow-sm ${
              statusColors[effectiveStatus] || statusColors.offline
            }`}
            title={`Statut: ${effectiveStatus}`}
          />
        )}
      </div>

      {showName && (
        <div className="min-w-0 text-left">
          <p className="text-sm font-bold text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
            {localName || "Utilisateur"}
          </p>
          {(subtext || user?.jobTitle || user?.department) && (
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {subtext || user?.jobTitle || user?.department}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

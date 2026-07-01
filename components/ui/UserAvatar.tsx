"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import Image from "next/image";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "away" | "busy" | "offline";
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

const statusColors = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
  offline: "bg-slate-400",
};

import { useEffect, useState } from "react";

export default function UserAvatar({
  src,
  name,
  size = "md",
  status = "online",
  showStatus = false,
  className = "",
}: UserAvatarProps) {
  const [localSrc, setLocalSrc] = useState(src);
  const [localName, setLocalName] = useState(name);

  useEffect(() => {
    setLocalSrc(src);
    setLocalName(name);
  }, [src, name]);

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
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  const isValidSrc = localSrc && (localSrc.startsWith('http') || localSrc.startsWith('data:image') || localSrc.startsWith('/'));

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`${sizeClasses[size]} rounded-xl overflow-hidden shadow-sm border border-slate-200 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600`}
      >
        {isValidSrc ? (
          <img
            src={localSrc}
            alt={localName || "Avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-bold text-white tracking-wider">
            {initials || <User className="w-1/2 h-1/2" />}
          </span>
        )}
      </motion.div>

      {showStatus && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusColors[status]} shadow-sm`}
        />
      )}
    </div>
  );
}

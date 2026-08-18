"use client";

import { motion } from "framer-motion";
import { Mail, Phone, Briefcase, MapPin, MessageSquare, Tag } from "lucide-react";
import Link from "next/link";
import UserAvatar, { AvatarUser } from "./UserAvatar";

export interface ContactCardUser extends AvatarUser {
  bio?: string | null;
  phone?: string | null;
  timezone?: string | null;
  skills?: string[] | string | null;
}

interface ContactCardProps {
  user: ContactCardUser;
  onChatClick?: () => void;
  className?: string;
}

export default function ContactCard({
  user,
  onChatClick,
  className = "",
}: ContactCardProps) {
  const parsedSkills: string[] = Array.isArray(user.skills)
    ? user.skills
    : typeof user.skills === "string" && user.skills.trim()
    ? user.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Header Avatar & Info */}
        <div className="flex items-start gap-4 mb-4">
          <UserAvatar
            user={user}
            size="lg"
            showStatus={true}
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-lg font-black text-slate-900 truncate">
              {user.name || user.email || "Utilisateur"}
            </h4>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
              {user.role || "Membre"}
            </p>
            <p className="text-xs text-slate-500 font-medium truncate mt-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-slate-400" />
              {user.jobTitle || user.department || "Collaborateur"}
            </p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl mb-4 italic line-clamp-2">
            "{user.bio}"
          </p>
        )}

        {/* Skills / Tags */}
        {parsedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {parsedSkills.slice(0, 4).map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1"
              >
                <Tag className="w-2.5 h-2.5 text-slate-400" />
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Location & Contact Details */}
        <div className="space-y-2 text-xs text-slate-600 mb-5 border-t border-slate-100 pt-3">
          {user.email && (
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          )}
          {user.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>{user.phone}</span>
            </div>
          )}
          {user.timezone && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              <span>{user.timezone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        {onChatClick ? (
          <button
            onClick={onChatClick}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Message
          </button>
        ) : (
          <Link
            href={`/chat?contactId=${user.id}`}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Envoyer un message
          </Link>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import ContextDrawer from "./ui/ContextDrawer";
import { Users, UserPlus, Shield, Trash2, Mail, ExternalLink, Check } from "lucide-react";
import UserAvatar from "./ui/UserAvatar";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  avatar?: string;
  image?: string;
  role?: string;
  email?: string;
}

interface ProjectMembersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  owner: Member;
  members: Member[];
}

export default function ProjectMembersDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
  owner,
  members,
}: ProjectMembersDrawerProps) {
  const [emailInput, setEmailInput] = useState("");
  const [invited, setInvited] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setInvited(true);
    setTimeout(() => {
      setEmailInput("");
      setInvited(false);
      alert(`Invitation envoyée avec succès à ${emailInput} !`);
    }, 1000);
  };

  const allMembers = [owner, ...members];

  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Équipe du projet — ${projectName}`}
      width="w-full sm:w-[500px] lg:w-[650px]"
    >
      <div className="p-6 space-y-6">
        {/* Banner */}
        <div className="p-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">{allMembers.length} Membre(s) l'équipe</h3>
              <p className="text-xs text-purple-100 mt-0.5">Permissions et rôles collaborateurs</p>
            </div>
          </div>
          <Link
            href={`/projects/${projectId}/members`}
            onClick={onClose}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
          >
            Gestion complète <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Invite input form */}
        <form onSubmit={handleInvite} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Inviter un nouveau membre par email</label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="ex: marie@entreprise.cm"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!emailInput.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Inviter
            </button>
          </div>
        </form>

        {/* Members List */}
        <div className="space-y-3">
          <h4 className="font-black text-slate-900 text-sm">Liste des membres ({allMembers.length})</h4>
          <div className="divide-y divide-slate-100 bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
            {allMembers.map((m, idx) => (
              <div key={m.id + idx} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <UserAvatar user={{ id: m.id, name: m.name, image: m.image }} size="md" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{m.email || `${m.name.toLowerCase().replace(" ", "")}@teamflows.com`}</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  idx === 0 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-purple-50 text-purple-700 border border-purple-100"
                }`}>
                  {idx === 0 ? "CHEF DE PROJET" : (m.role || "MEMBRE")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContextDrawer>
  );
}

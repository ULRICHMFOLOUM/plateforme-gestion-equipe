"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Trash2, ShieldCheck, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "../ui/UserAvatar";
import { Button } from "../ui/Button";

interface GroupMember {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  isAdmin?: boolean;
}

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
  currentUserId: string;
  onMembersUpdated?: () => void;
}

export default function GroupManagementModal({
  isOpen,
  onClose,
  roomId,
  roomName,
  currentUserId,
  onMembersUpdated,
}: GroupManagementModalProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [availableContacts, setAvailableContacts] = useState<GroupMember[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdById, setCreatedById] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"members" | "add">("members");

  const fetchRoomMembers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/chat/rooms/${roomId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setCreatedById(data.createdById || "");
      }
    } catch (err) {
      console.error("Erreur chargement membres:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        const contactsList = (data.contacts || []).map((c: any) => ({
          id: c.contactId,
          name: c.name,
          email: c.email,
          image: c.image || c.avatar,
        }));
        setAvailableContacts(contactsList);
      }
    } catch (err) {
      console.error("Erreur chargement contacts:", err);
    }
  };

  useEffect(() => {
    if (isOpen && roomId) {
      fetchRoomMembers();
      fetchContacts();
    }
  }, [isOpen, roomId]);

  const isAdmin = createdById === currentUserId;

  const handleAddMembers = async () => {
    if (selectedToAdd.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedToAdd }),
      });
      if (res.ok) {
        setSelectedToAdd([]);
        setActiveTab("members");
        fetchRoomMembers();
        if (onMembersUpdated) onMembersUpdated();
      }
    } catch (err) {
      console.error("Erreur ajout membres:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre du groupe ?")) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/members?userId=${targetUserId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchRoomMembers();
        if (onMembersUpdated) onMembersUpdated();
      } else {
        const data = await res.json();
        alert(data.error || "Impossible de retirer le membre.");
      }
    } catch (err) {
      console.error("Erreur suppression membre:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingMemberIds = new Set(members.map((m) => m.id));
  const contactsNotJoined = availableContacts.filter((c) => !existingMemberIds.has(c.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-display font-black text-slate-900 truncate">
              {roomName}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {members.length} membre{members.length > 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/30 p-2 gap-2">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "members" ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:bg-white/50"
            }`}
          >
            Membres ({members.length})
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "add" ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:bg-white/50"
            }`}
          >
            + Ajouter des membres
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-xs font-bold">Chargement des membres...</p>
            </div>
          ) : activeTab === "members" ? (
            <div className="space-y-3">
              {members.map((member) => {
                const isGroupAdmin = createdById === member.id;
                const isSelf = currentUserId === member.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100/60 transition-all"
                  >
                    <UserAvatar
                      user={member}
                      size="sm"
                      showName={true}
                      subtext={isGroupAdmin ? "Administrateur" : member.jobTitle || member.email}
                    />

                    <div className="flex items-center gap-2">
                      {isGroupAdmin && (
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black uppercase rounded-xl flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-500" /> Admin
                        </span>
                      )}

                      {(isAdmin || isSelf) && !isGroupAdmin && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isSubmitting}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title={isSelf ? "Quitter le groupe" : "Retirer du groupe"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-bold">
                Sélectionnez des contacts de votre annuaire à ajouter au groupe :
              </p>

              {contactsNotJoined.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold">Tous vos contacts sont déjà dans ce groupe !</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {contactsNotJoined.map((contact) => {
                    const isSelected = selectedToAdd.includes(contact.id);

                    return (
                      <div
                        key={contact.id}
                        onClick={() =>
                          setSelectedToAdd((prev) =>
                            isSelected ? prev.filter((id) => id !== contact.id) : [...prev, contact.id]
                          )
                        }
                        className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected ? "border-blue-500 bg-blue-50/50" : "border-slate-100 bg-slate-50 hover:bg-white"
                        }`}
                      >
                        <UserAvatar user={contact} size="sm" showName={true} subtext={contact.email} />
                        <div
                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${
                            isSelected ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <span className="text-xs font-bold">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {contactsNotJoined.length > 0 && (
                <Button
                  variant="primary"
                  className="w-full py-3.5 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-700"
                  disabled={selectedToAdd.length === 0 || isSubmitting}
                  onClick={handleAddMembers}
                  loading={isSubmitting}
                >
                  Ajouter les membres sélectionnés ({selectedToAdd.length})
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

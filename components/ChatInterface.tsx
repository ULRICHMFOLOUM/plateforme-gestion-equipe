"use client";
/**
 * Composant : Interface de Chat (Messagerie)
 * Fonction : Gère les conversations en temps réel, les notes vocales, l'envoi de fichiers et la gestion des groupes.
 */

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Users,
  MessageCircle,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Search,
  Smile,
  Phone,
  MoreVertical,
  ArrowLeft,
  Check,
  CheckCheck,
  X,
  Video as VideoIcon,
  User as UserIcon,
  Trash2,
  Loader2,
  Pin,
  Plus,
  Mic,
  CheckSquare,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import EmojiPicker from "emoji-picker-react";
import { pusherClient } from "@/lib/pusher-client";
import LoadingScreen from "@/components/ui/LoadingScreen";
import UserAvatar from "@/components/ui/UserAvatar";
import AudioRecorder from "@/components/ui/AudioRecorder";
import AudioPlayer from "@/components/ui/AudioPlayer";
import GroupManagementModal from "@/components/chat/GroupManagementModal";
import { playNotificationSound } from "@/lib/audio";
import { showSystemNotification, requestPushPermission } from "@/lib/push";
import { showToast } from "@/components/ui/Toast";

interface MessageFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage?: string | null;
  timestamp: Date;
  roomId: string;
  status?: "sent" | "delivered" | "read";
  files?: MessageFile[];
  reactions?: Record<string, string[]>; // { "👍": ["user1", "user2"] }
  isPinned?: boolean;
}

interface RoomParticipant {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  status?: "online" | "away" | "busy" | "offline";
  jobTitle?: string | null;
}

interface Room {
  id: string;
  name: string;
  type: "DIRECT" | "GROUP";
  participants: RoomParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
  pinnedMessageId?: string | null;
}

export function ChatInterface({ isWidget = false }: { isWidget?: boolean }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Route parameters for deep linking
  const targetContactId = searchParams.get("contactId");
  const targetRoomId = searchParams.get("roomId");

  // State Management
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  
  // Isolated State by RoomId to prevent data leaks between discussions
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, Message[]>>({});
  
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Contacts for 1:1 WhatsApp style chat creation
  const [contacts, setContacts] = useState<RoomParticipant[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [newChatType, setNewChatType] = useState<"DIRECT" | "GROUP">("DIRECT");
  const [groupName, setGroupName] = useState("");
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);

  // Lightbox Preview Image State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // DOM Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Initial Fetch Rooms
  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/chat/rooms");
      if (response.ok) {
        const userRooms = await response.json();
        setRooms(userRooms);
        if (userRooms.length > 0 && !currentRoom && !targetRoomId && !targetContactId) {
          handleRoomChange(userRooms[0].id);
        }
      }
    } catch (error) {
      console.error("Erreur chargement salons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session) {
      fetchRooms();
    }
    // Auto-request push notification permission
    requestPushPermission().catch(() => {});
  }, [session, status]);

  // Real-time Pusher Subscription for current room
  useEffect(() => {
    if (!currentRoom || !session?.user?.id || !pusherClient) return;

    const channel = pusherClient.subscribe(`presence-room-${currentRoom}`);

    channel.bind("message", (message: Message) => {
      // Trigger sound, green toast & push notification if message is from another user
      if (message.senderId !== session.user.id) {
        // Green success toast visible everywhere on the app
        showToast({
          type: "success",
          title: `💬 ${message.senderName}`,
          message: message.content?.substring(0, 80) || "Nouveau message reçu",
          duration: 5000,
        });
        // Native desktop push notification
        showSystemNotification(`💬 ${message.senderName}`, {
          body: message.content || "Nouveau fichier / message vocal",
        });
      }

      setMessagesByRoom((prev) => {
        const roomMsgs = prev[currentRoom] || [];
        const exists = roomMsgs.some(
          (m) =>
            m.id === message.id ||
            (m.id.startsWith("temp-") &&
              m.content === message.content &&
              m.senderId === message.senderId)
        );

        if (exists) {
          return {
            ...prev,
            [currentRoom]: roomMsgs.map((m) =>
              m.id.startsWith("temp-") &&
              m.content === message.content &&
              m.senderId === message.senderId
                ? message
                : m
            ),
          };
        }
        return {
          ...prev,
          [currentRoom]: [...roomMsgs, message],
        };
      });
    });

    return () => {
      pusherClient?.unsubscribe(`presence-room-${currentRoom}`);
    };
  }, [currentRoom, session]);

  // Deep linking URL parameter handling
  useEffect(() => {
    if (!session || rooms.length === 0) return;

    if (targetRoomId) {
      const existingRoom = rooms.find((r) => r.id === targetRoomId);
      if (existingRoom) {
        handleRoomChange(existingRoom.id);
      }
    } else if (targetContactId) {
      const existingRoom = rooms.find(
        (r) => r.type === "DIRECT" && r.participants.some((p) => p.id === targetContactId)
      );

      if (existingRoom) {
        handleRoomChange(existingRoom.id);
      } else {
        // Automatically trigger Direct chat creation
        handleCreateDirectChat(targetContactId);
      }
    }
  }, [rooms, session, targetContactId, targetRoomId]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesByRoom, currentRoom]);

  // Handle Room Change with strict data isolation
  const handleRoomChange = async (roomId: string) => {
    setCurrentRoom(roomId);
    setShowMobileChat(true);
    setShowOptionsMenu(false);

    // Fetch room messages if not cached
    if (!messagesByRoom[roomId]) {
      try {
        setIsFetchingMessages(true);
        const response = await fetch(`/api/chat/messages/${roomId}`);
        if (response.ok) {
          const roomMessages = await response.json();
          setMessagesByRoom((prev) => ({ ...prev, [roomId]: roomMessages }));
        }
      } catch (error) {
        console.error("Erreur chargement messages salon:", error);
      } finally {
        setIsFetchingMessages(false);
      }
    }
  };

  // Fetch Team Directory Contacts for WhatsApp-style picker
  const loadContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        const contactList = (data.contacts || []).map((c: any) => ({
          id: c.contactId,
          name: c.name,
          email: c.email,
          image: c.image || c.avatar,
          status: c.status || "offline",
        }));
        setContacts(contactList);
      }
    } catch (err) {
      console.error("Erreur chargement contacts pour chat:", err);
    }
  };

  // Create 1:1 Direct Chat Idempotently
  const handleCreateDirectChat = async (contactId: string) => {
    if (isCreatingChat) return;
    setIsCreatingChat(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DIRECT",
          participants: [contactId],
        }),
      });

      if (res.ok) {
        const room = await res.json();
        setRooms((prev) => {
          const exists = prev.some((r) => r.id === room.id);
          return exists ? prev : [room, ...prev];
        });
        handleRoomChange(room.id);
        setShowCreateRoomModal(false);
      }
    } catch (err) {
      console.error("Erreur création chat direct:", err);
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Create Group Chat
  const handleCreateGroupChat = async () => {
    if (isCreatingChat || !groupName.trim() || selectedContactIds.length === 0) return;
    setIsCreatingChat(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GROUP",
          name: groupName.trim(),
          participants: selectedContactIds,
        }),
      });

      if (res.ok) {
        const room = await res.json();
        setRooms((prev) => [room, ...prev]);
        handleRoomChange(room.id);
        setShowCreateRoomModal(false);
        setGroupName("");
        setSelectedContactIds([]);
      }
    } catch (err) {
      console.error("Erreur création groupe:", err);
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Send Message (Text, Files, or Voice)
  const handleSendMessage = async (e?: React.FormEvent, voiceFile?: File) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0 && !voiceFile) || !currentRoom || !session?.user?.id)
      return;

    const messageContent = newMessage;
    const filesToUpload = voiceFile ? [voiceFile] : [...selectedFiles];
    const tempId = `temp-${Date.now()}`;

    // Optimistic UI Update
    const tempMessage: Message = {
      id: tempId,
      content: messageContent,
      senderId: session.user.id,
      senderName: session.user.name || session.user.email || "Moi",
      senderImage: session.user.image,
      timestamp: new Date(),
      roomId: currentRoom,
      status: "sent",
      files: filesToUpload.map((f) => ({
        id: `temp-file-${Math.random()}`,
        name: f.name,
        type: f.type,
        size: f.size,
        url: URL.createObjectURL(f),
      })),
    };

    setMessagesByRoom((prev) => ({
      ...prev,
      [currentRoom]: [...(prev[currentRoom] || []), tempMessage],
    }));

    setNewMessage("");
    setSelectedFiles([]);
    setShowEmojiPicker(false);

    try {
      let uploadedFiles = [];

      if (filesToUpload.length > 0) {
        const formData = new FormData();
        filesToUpload.forEach((file) => formData.append("files", file));

        const uploadRes = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) uploadedFiles = await uploadRes.json();
      }

      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          roomId: currentRoom,
          files: uploadedFiles,
        }),
      });

      if (!res.ok) throw new Error("Échec d'envoi");
    } catch (err) {
      console.error("Erreur envoi message:", err);
    }
  };

  // Toggle Reaction on Message
  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentRoom || !session?.user?.id) return;
    const userId = session.user.id;

    setMessagesByRoom((prev) => {
      const roomMsgs = prev[currentRoom] || [];
      return {
        ...prev,
        [currentRoom]: roomMsgs.map((msg) => {
          if (msg.id !== messageId) return msg;

          const currentReactions = msg.reactions || {};
          const usersForEmoji = currentReactions[emoji] || [];
          const hasReacted = usersForEmoji.includes(userId);

          const updatedUsers = hasReacted
            ? usersForEmoji.filter((id) => id !== userId)
            : [...usersForEmoji, userId];

          const updatedReactions = { ...currentReactions, [emoji]: updatedUsers };
          if (updatedUsers.length === 0) delete updatedReactions[emoji];

          return { ...msg, reactions: updatedReactions };
        }),
      };
    });
  };

  // Convert Message to Task
  const handleConvertToTask = async (message: Message) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: message.content.slice(0, 50) || "Tâche issue du chat",
          description: `Créée depuis le message de ${message.senderName} : "${message.content}"`,
          priority: "MEDIUM",
          status: "TODO",
        }),
      });

      if (res.ok) {
        alert("Tâche créée avec succès dans votre liste de tâches !");
      }
    } catch (err) {
      console.error("Erreur création tâche:", err);
    }
  };

  // Active room messages
  const activeMessages = currentRoom ? messagesByRoom[currentRoom] || [] : [];
  const currentRoomData = rooms.find((r) => r.id === currentRoom);

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const renderMessageText = (content: string, isMine: boolean) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+|\/(?:video|projects|tasks)[^\s]*)/gi;
    const parts = content.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        const isVideoLink = /video|visio|jitsi|meet/i.test(part);

        if (isVideoLink) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold text-xs shadow-lg transition-all my-1.5 ${
                isMine
                  ? "bg-white text-blue-700 hover:bg-blue-50 shadow-blue-900/20"
                  : "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-red-500/20"
              }`}
            >
              <Video className="w-4 h-4 animate-pulse shrink-0" />
              <span>Rejoindre la visioconférence</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
            </a>
          );
        }

        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline font-bold break-all transition-opacity hover:opacity-80 ${
              isMine ? "text-white" : "text-blue-600"
            }`}
          >
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <div className={isWidget ? "h-full w-full bg-slate-50 flex overflow-hidden relative" : "h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex overflow-hidden"}>
      {/* ── Left Sidebar (Conversations List) ── */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`
          ${(showMobileChat && currentRoomData) ? "hidden" : "flex"}
          ${isWidget ? "w-full flex-col bg-white" : "lg:flex flex-col w-full lg:w-96 bg-white/80 backdrop-blur-xl border-r border-slate-200/80"} z-10 h-full
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
              </Link>
              <h2 className="text-2xl font-display font-black text-slate-900">Messages</h2>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/60 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="p-4 border-b border-slate-100">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowCreateRoomModal(true);
              loadContacts();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </motion.button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room) => {
            const isSelected = currentRoom === room.id;
            const otherParticipant = room.participants[0];

            return (
              <div
                key={room.id}
                onClick={() => handleRoomChange(room.id)}
                className={`p-4 cursor-pointer transition-all border-b border-slate-100/60 flex items-center justify-between ${
                  isSelected
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-600"
                    : "hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <UserAvatar
                    user={room.type === "DIRECT" ? otherParticipant : undefined}
                    name={room.name}
                    userId={room.type === "DIRECT" ? otherParticipant?.id : room.id}
                    size="md"
                    showStatus={true}
                    status={otherParticipant?.status || "offline"}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{room.name}</h4>
                      {room.lastMessage && (
                        <span className="text-[10px] text-slate-400 font-bold ml-2 flex-shrink-0">
                          {formatTime(room.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                      {room.lastMessage?.content ||
                        `${room.participants.length} participant${
                          room.participants.length > 1 ? "s" : ""
                        }`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRooms.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">Aucune discussion</p>
              <p className="text-xs mt-1">Cliquez sur "Nouvelle conversation" pour commencer</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Main Chat Area ── */}
      {currentRoomData ? (
        <div className={`
          ${(showMobileChat || isWidget) ? "flex" : "hidden"}
          ${isWidget ? "w-full flex-col bg-white h-full" : "lg:flex flex-col flex-1 bg-white/40 backdrop-blur-xl h-full"}
        `}>
          {/* Header */}
          <div className="p-3 sm:p-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowMobileChat(false);
                  if (isWidget) setCurrentRoom(null);
                }}
                className={`${isWidget ? "block" : "lg:hidden"} p-2 hover:bg-slate-100 rounded-xl transition-colors`}
                title="Retour aux discussions"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>

              <UserAvatar
                user={currentRoomData.type === "DIRECT" ? currentRoomData.participants[0] : undefined}
                name={currentRoomData.name}
                userId={currentRoomData.type === "DIRECT" ? currentRoomData.participants[0]?.id : currentRoomData.id}
                size="md"
                showStatus={true}
                status={currentRoomData.participants[0]?.status || "offline"}
              />

              <div>
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  {currentRoomData.name}
                </h3>
                <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                  {currentRoomData.type === "GROUP" ? (
                    <>
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      {currentRoomData.participants.length} membres
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> En ligne
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Room Options & Actions */}
            <div className="flex items-center gap-2">
              {currentRoomData.type === "GROUP" && (
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Users className="w-4 h-4" />
                  Gérer le groupe
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {showOptionsMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                    >
                      {currentRoomData.type === "GROUP" && (
                        <button
                          onClick={() => {
                            setShowOptionsMenu(false);
                            setShowGroupModal(true);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-blue-500" />
                          Membres &amp; Droits Admin
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowOptionsMenu(false);
                          router.push("/profile");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Voir le profil
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Pinned Message Banner */}
          {pinnedMessage && (
            <div className="bg-amber-50/90 backdrop-blur-md border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 font-medium">
              <div className="flex items-center gap-2 truncate">
                <Pin className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="font-bold">Message épinglé :</span>
                <span className="truncate italic">"{pinnedMessage.content}"</span>
              </div>
              <button
                onClick={() => setPinnedMessage(null)}
                className="p-1 hover:bg-amber-100 rounded-lg text-amber-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Messages Scroll View */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isFetchingMessages ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              activeMessages.map((message) => {
                const isMine = message.senderId === session?.user?.id;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"} group relative`}
                  >
                    <div className={`flex items-start gap-3 max-w-lg ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                      <UserAvatar
                        src={message.senderImage}
                        name={message.senderName}
                        userId={message.senderId}
                        size="xs"
                        className="mt-1"
                      />

                      <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                        {/* Bubble */}
                        <div
                          className={`p-4 rounded-3xl ${
                            isMine
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-xl shadow-blue-500/10"
                              : "bg-white text-slate-900 rounded-tl-none border border-slate-100 shadow-lg shadow-slate-100"
                          }`}
                        >
                          {!isMine && (
                            <p className="text-xs font-black text-blue-600 mb-1.5">
                              {message.senderName}
                            </p>
                          )}

                          {/* Message Content */}
                          {message.content && (
                            <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                              {renderMessageText(message.content, isMine)}
                            </div>
                          )}

                          {/* Files / Images / Audio Inline Previews */}
                          {message.files && message.files.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.files.map((file, idx) => {
                                const isAudio = file.type?.startsWith("audio/") || file.name.endsWith(".webm");
                                const isImage = file.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.url);

                                if (isAudio) {
                                  return (
                                    <AudioPlayer key={idx} src={file.url} isMine={isMine} />
                                  );
                                }

                                if (isImage) {
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => setPreviewImageUrl(file.url)}
                                      className="cursor-pointer rounded-2xl overflow-hidden border border-white/20 max-w-xs shadow-md hover:opacity-90 transition-opacity"
                                    >
                                      <img src={file.url} alt={file.name} className="w-full h-auto max-h-60 object-cover" />
                                    </div>
                                  );
                                }

                                return (
                                  <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold ${
                                      isMine ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    <File className="w-4 h-4" />
                                    <span className="truncate">{file.name}</span>
                                    <Download className="w-3.5 h-3.5 ml-auto opacity-75" />
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          {/* Time */}
                          <div className={`text-[10px] font-bold mt-1 text-right ${isMine ? "text-blue-100/70" : "text-slate-400"}`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>

                        {/* Reactions List */}
                        {message.reactions && Object.keys(message.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(message.reactions).map(([emoji, users]) => (
                              <span
                                key={emoji}
                                onClick={() => handleToggleReaction(message.id, emoji)}
                                className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[11px] font-bold shadow-sm cursor-pointer hover:bg-slate-50 flex items-center gap-1"
                              >
                                <span>{emoji}</span>
                                <span className="text-[9px] text-slate-500 font-extrabold">{users.length}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Hover Action Bar */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 bg-white border border-slate-200 shadow-md rounded-full px-2 py-1">
                          {["❤️", "👍", "😂", "🚀", "😮"].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(message.id, emoji)}
                              className="hover:scale-125 transition-transform text-xs p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            onClick={() => setPinnedMessage(message)}
                            className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                            title="Épingler"
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleConvertToTask(message)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Convertir en tâche"
                          >
                            <CheckSquare className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Selected File Previews */}
          {selectedFiles.length > 0 && (
            <div className="px-6 py-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Toolbar */}
          <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200/80">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              {/* File Attachment Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                title="Joindre des fichiers"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez un message..."
                className="flex-1 bg-slate-100/60 border-2 border-slate-200/60 focus:bg-white focus:border-blue-500 rounded-2xl py-3 px-5 text-sm font-medium outline-none transition-all"
              />

              {/* Audio Recorder */}
              <AudioRecorder
                onRecordingComplete={(voiceFile) => handleSendMessage(undefined, voiceFile)}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!newMessage.trim() && selectedFiles.length === 0}
                className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-col items-center justify-center flex-1 text-slate-400 p-8">
          <MessageCircle className="w-16 h-16 opacity-20 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">Vos discussions</h3>
          <p className="text-sm font-medium mt-1">Sélectionnez une conversation ou démarrez-en une nouvelle.</p>
        </div>
      )}

      {/* ── WhatsApp Style New Chat Modal ── */}
      <AnimatePresence>
        {showCreateRoomModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowCreateRoomModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900">Nouvelle conversation</h3>
                <button onClick={() => setShowCreateRoomModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
                <button
                  onClick={() => setNewChatType("DIRECT")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    newChatType === "DIRECT" ? "bg-white text-blue-600 shadow-md" : "text-slate-500"
                  }`}
                >
                  Message direct (1:1)
                </button>
                <button
                  onClick={() => setNewChatType("GROUP")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    newChatType === "GROUP" ? "bg-white text-blue-600 shadow-md" : "text-slate-500"
                  }`}
                >
                  Nouveau groupe
                </button>
              </div>

              {newChatType === "GROUP" && (
                <div className="mb-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Équipe Design, Projet Alpha..."
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl py-3 px-4 text-sm font-bold outline-none"
                  />
                </div>
              )}

              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                {newChatType === "DIRECT" ? "Choisissez un contact dans votre annuaire :" : "Sélectionnez les participants :"}
              </p>

              {/* Contact List */}
              <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      if (newChatType === "DIRECT") {
                        handleCreateDirectChat(contact.id);
                      } else {
                        setSelectedContactIds((prev) =>
                          prev.includes(contact.id)
                            ? prev.filter((id) => id !== contact.id)
                            : [...prev, contact.id]
                        );
                      }
                    }}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedContactIds.includes(contact.id)
                        ? "border-blue-500 bg-blue-50/50"
                        : "border-slate-100 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <UserAvatar user={contact} size="sm" showName={true} subtext={contact.email} showStatus={true} />
                    {newChatType === "GROUP" && (
                      <div
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${
                          selectedContactIds.includes(contact.id)
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {selectedContactIds.includes(contact.id) && <span className="text-xs font-bold">✓</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {newChatType === "GROUP" && (
                <button
                  onClick={handleCreateGroupChat}
                  disabled={!groupName.trim() || selectedContactIds.length === 0 || isCreatingChat}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/20 disabled:opacity-50"
                >
                  {isCreatingChat ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Créer le groupe"}
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Group Management Modal */}
      {currentRoomData && currentRoomData.type === "GROUP" && (
        <GroupManagementModal
          isOpen={showGroupModal}
          onClose={() => setShowGroupModal(false)}
          roomId={currentRoomData.id}
          roomName={currentRoomData.name}
          currentUserId={session.user.id}
          onMembersUpdated={fetchRooms}
        />
      )}

      {/* Image Preview Lightbox */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/40 rounded-full text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={previewImageUrl} alt="Aperçu" className="max-w-full max-h-[90vh] object-contain rounded-2xl" />
        </div>
      )}
    </div>
  );
}

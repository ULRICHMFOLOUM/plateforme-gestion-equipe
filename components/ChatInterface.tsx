"use client";
/**
 * Composant : Interface de Chat (Messagerie)
 * Fonction : Gère les conversations en temps réel, l'envoi de fichiers et la visioconférence.
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Users,
  MessageCircle,
  Paperclip,
  Download,
  FileText,
  Image,
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
  PhoneCall,
  Video as VideoIcon,
  User,
  Trash2,
  Loader2,
} from "lucide-react";
import { pusherClient } from "@/lib/pusher-client";
import EmojiPicker from "emoji-picker-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import LoadingScreen from "@/components/ui/LoadingScreen";

// Définition des types de données pour la messagerie
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  roomId: string;
  status?: "sent" | "delivered" | "read";
  files?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
  reactions?: { emoji: string; userId: string }[];
}

interface Room {
  id: string;
  name: string;
  type: "DIRECT" | "GROUP";
  participants: {
    id: string;
    name: string | null;
    email: string;
    status?: "online" | "away" | "offline";
  }[];
  lastMessage?: Message;
  unreadCount?: number;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  status?: "online" | "away" | "offline";
}

/**
 * Composant Principal de l'Interface de Chat
 */
export function ChatInterface() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // États pour la gestion des données (React Hooks)
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newChatType, setNewChatType] = useState<"DIRECT" | "GROUP">("DIRECT");
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // Paramètres d'URL pour le routage profond (Deep Linking)
  const searchParams = useSearchParams();
  const targetContactId = searchParams.get("contactId");
  const targetRoomId = searchParams.get("roomId");
  
  // Références pour le DOM (Scrolling et Input Fichier)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirection si déconnecté
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  /**
   * Effet : Chargement initial des salons de discussion
   */
  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const fetchRooms = async () => {
      try {
        const response = await fetch("/api/chat/rooms");
        if (response.ok) {
          const userRooms = await response.json();
          setRooms(userRooms);
          // Ouvre automatiquement le premier salon si aucun n'est sélectionné
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

    fetchRooms();
  }, [session, status]);

  /**
   * Effet : Abonnement au temps réel via Pusher
   * Dès qu'un salon est sélectionné, on écoute les nouveaux messages.
   */
  useEffect(() => {
    if (!currentRoom || !session?.user?.id || !pusherClient) return;

    // Souscription au canal spécifique du salon
    const channel = pusherClient.subscribe(`presence-room-${currentRoom}`);

    // Liaison de l'événement "message"
    channel.bind("message", (message: Message) => {
      setMessages((prev) => {
        // Évite les doublons si le message a déjà été ajouté par l'UI Optimiste
        const exists = prev.some((m) => m.id === message.id || 
          (m.id.startsWith("temp-") && m.content === message.content && m.senderId === message.senderId));
        
        if (exists) {
          // Remplace le message temporaire par le message définitif du serveur
          return prev.map((m) => (m.id.startsWith("temp-") && m.content === message.content && m.senderId === message.senderId ? message : m));
        }
        return [...prev, message];
      });
    });

    // Nettoyage de l'abonnement à la fermeture
    return () => {
      pusherClient?.unsubscribe(`presence-room-${currentRoom}`);
    };
  }, [currentRoom, session]);

  /**
   * Effet : Gestion des changements d'URL
   */
  useEffect(() => {
    if (!session || rooms.length === 0) return;

    if (targetRoomId) {
      const existingRoom = rooms.find(r => r.id === targetRoomId);
      if (existingRoom) {
        handleRoomChange(existingRoom.id);
      }
    } else if (targetContactId) {
      const existingRoom = rooms.find(r => 
        r.type === "DIRECT" && r.participants.some(p => p.id === targetContactId)
      );
      
      if (existingRoom) {
        handleRoomChange(existingRoom.id);
      }
    }
  }, [rooms, session, targetContactId, targetRoomId]);

  // Scroll automatique vers le bas lors de nouveaux messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Envoi d'un message avec MISE À JOUR OPTIMISTE
   * On affiche le message pour l'utilisateur AVANT que le serveur ne réponde pour plus de fluidité.
   */
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !currentRoom || !session?.user?.id) return;

    const messageContent = newMessage;
    const filesToUpload = [...selectedFiles];
    const tempId = `temp-${Date.now()}`;

    // 1. MISE À JOUR OPTIMISTE
    const tempMessage: Message = {
      id: tempId,
      content: messageContent,
      senderId: session.user.id,
      senderName: session.user.name || session.user.email || "Moi",
      timestamp: new Date(),
      roomId: currentRoom,
      status: "sent",
      files: filesToUpload.map(f => ({
        id: `temp-file-${Math.random()}`,
        name: f.name,
        type: f.type,
        size: f.size,
        url: URL.createObjectURL(f), 
      })),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    setSelectedFiles([]);
    setShowEmojiPicker(false);

    try {
      let uploadedFiles = [];

      // 2. Upload des fichiers (si présents)
      if (filesToUpload.length > 0) {
        const formData = new FormData();
        filesToUpload.forEach((file) => { formData.append("files", file); });

        const uploadResponse = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) uploadedFiles = await uploadResponse.json();
        else throw new Error("Échec de l'upload");
      }

      // 3. Envoi final de la requête à l'API Chat
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          roomId: currentRoom,
          files: uploadedFiles,
        }),
      });

      if (!response.ok) throw new Error("Échec de l'envoi");

    } catch (error) {
      console.error("Erreur envoi message:", error);
      alert("Impossible d'envoyer le message. Pas d'inquiétude, il s'agit peut-être d'un problème réseau.");
    }
  };

  /**
   * Change le salon actif et charge son historique
   */
  const handleRoomChange = async (roomId: string) => {
    setCurrentRoom(roomId);
    setShowMobileChat(true); // Pour le responsive
    
    try {
      const response = await fetch(`/api/chat/messages/${roomId}`);
      if (response.ok) {
        const roomMessages = await response.json();
        setMessages(roomMessages);
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (file.type.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (file.type.includes("pdf") || file.type.includes("document"))
      return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  // Load contacts for new conversation
  const loadContacts = async () => {
    try {
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const data = await response.json();
        const contactsAsUsers = (data.contacts || []).map((contact: any) => ({
          id: contact.contactId,
          name: contact.name,
          email: contact.email,
          image: contact.image,
          status: contact.status || "offline",
        }));
        setUsers(contactsAsUsers);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des contacts:", error);
    }
  };

  const handleCreateConversation = async (user?: User) => {
    try {
       const participants = user ? [user.id] : selectedUsers;
       
       if (participants.length === 0) return;

       const response = await fetch("/api/chat/rooms", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           type: newChatType,
           name: newChatType === "GROUP" ? groupName : undefined,
           participants: participants,
         }),
       });

       if (response.ok) {
         const newRoom = await response.json();
         setRooms(prev => [newRoom, ...prev]);
         handleRoomChange(newRoom.id);
         setShowCreateRoom(false);
         setSearchQuery("");
         setSelectedUsers([]);
         setGroupName("");
         setNewChatType("DIRECT");
       }
    } catch (error) {
      console.error("Erreur lors de la création de la conversation:", error);
    }
  };

  const handleStartCall = async (type: "video" | "audio") => {
    if (!currentRoomData) return;

    try {
      const callTitle = `${type === "video" ? "Appel vidéo" : "Appel audio"} - ${currentRoomData.name}`;
      const response = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: callTitle,
          description: `Démarré depuis le chat ${currentRoomData.name}`,
          startTime: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const conference = await response.json();
        const callMessage = `📞 J'ai démarré un ${type === "video" ? "appel vidéo" : "appel audio"}.\nRejoignez-moi ici : [/video?conferenceId=${conference.id}](/video)`;
        
        await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: callMessage,
            roomId: currentRoom,
          }),
        });

        router.push("/video");
      }
    } catch (error) {
      console.error("Erreur lors du démarrage de l'appel:", error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentRoom || !confirm("Voulez-vous vraiment supprimer cette conversation ? Cette action est irréversible.")) return;
    
    // Pour l'instant on simule la suppression en changeant de room
    // On pourrait ajouter une route API pour supprimer la room et ses messages
    setRooms(prev => prev.filter(r => r.id !== currentRoom));
    setCurrentRoom(null);
    setShowOptionsMenu(false);
    alert("Conversation supprimée");
  };

  const handleClearChat = () => {
    if (!confirm("Voulez-vous vraiment vider cette discussion ?")) return;
    setMessages([]);
    setShowOptionsMenu(false);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();

    if (diff < 60000) return "À l'instant";
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)}min`;
    if (diff < 86400000)
      return new Date(date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const currentRoomData = rooms.find((room) => room.id === currentRoom);

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const StatusIndicator = ({
    status,
  }: {
    status?: "online" | "away" | "offline";
  }) => (
    <div
      className={`w-3 h-3 rounded-full border-2 border-white ${
        status === "online"
          ? "bg-green-500"
          : status === "away"
            ? "bg-yellow-500"
            : "bg-slate-400"
      }`}
    />
  );

  const MessageStatus = ({ status }: { status?: string }) => {
    if (status === "sent") return <Check className="w-4 h-4 text-slate-400" />;
    if (status === "delivered")
      return <CheckCheck className="w-4 h-4 text-slate-400" />;
    return <CheckCheck className="w-4 h-4 text-blue-500" />;
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-4 bg-slate-50/50">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Connexion au serveur...
        </p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex">
      {/* Contacts Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`
          ${showMobileChat ? "hidden" : "flex"}
          lg:flex flex-col w-full lg:w-96 bg-white/80 backdrop-blur-xl border-r border-slate-200
        `}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            </Link>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              Messages
            </h2>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div className="p-4 border-b border-slate-200">
          <motion.button
            onClick={() => {
              setShowCreateRoom(true);
              loadContacts();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Nouvelle conversation
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleRoomChange(room.id)}
              className={`
                p-4 cursor-pointer transition-all
                ${
                  currentRoom === room.id
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500"
                    : "hover:bg-slate-50"
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                    {room.type === "DIRECT"
                      ? room.participants[0]?.name?.charAt(0).toUpperCase() ||
                        "U"
                      : room.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <StatusIndicator
                      status={room.participants[0]?.status || "offline"}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {room.name}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {room.lastMessage
                        ? formatTime(room.lastMessage.timestamp)
                        : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600 truncate">
                      {room.lastMessage?.content ||
                        `${room.participants.length} participant${room.participants.length > 1 ? "s" : ""}`}
                    </p>

                    {(room.unreadCount || 0) > 0 && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold rounded-full">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredRooms.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-sm">Aucune conversation</p>
              <p className="text-xs mt-1">
                Cliquez sur "Nouvelle conversation" pour commencer
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat Area */}
      {currentRoomData ? (
        <div
          className={`
          ${showMobileChat ? "flex" : "hidden"}
          lg:flex flex-col flex-1
        `}
        >
          <div className="p-4 bg-white/80 backdrop-blur-xl border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                    {currentRoomData.type === "DIRECT"
                      ? currentRoomData.participants[0]?.name
                          ?.charAt(0)
                          .toUpperCase() || "U"
                      : currentRoomData.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <StatusIndicator
                      status={
                        currentRoomData.participants[0]?.status || "offline"
                      }
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    {currentRoomData.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {currentRoomData.participants.length} participant
                    {currentRoomData.participants.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleStartCall("audio")}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Appel audio"
                >
                  <Phone className="w-5 h-5 text-slate-600" />
                </button>
                <button 
                  onClick={() => handleStartCall("video")}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Appel vidéo"
                >
                  <Video className="w-5 h-5 text-slate-600" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-600" />
                  </button>

                  <AnimatePresence>
                    {showOptionsMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 overflow-hidden backdrop-blur-xl"
                      >
                        <button 
                          onClick={() => {
                            if (currentRoomData.type === "DIRECT") {
                              router.push("/profile");
                            }
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          Voir le profil
                        </button>
                        <button 
                          onClick={handleClearChat}
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          Vider la discussion
                        </button>
                        <div className="h-px bg-slate-100 my-1" />
                        <button 
                          onClick={handleDeleteConversation}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer la conversation
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => {
                const isMine = message.senderId === session?.user?.id;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-md ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}
                    >
                      <div
                        className={`
                          px-4 py-3 rounded-2xl
                          ${
                            isMine
                              ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-sm"
                              : "bg-white text-slate-900 rounded-bl-sm shadow-md"
                          }
                        `}
                      >
                        {!isMine && (
                          <p className="text-xs font-medium mb-1 text-blue-600">
                            {message.senderName}
                          </p>
                        )}

                         {message.content && (
                           <div className="whitespace-pre-wrap break-words">
                             {message.content.split(/((?:https?:\/\/|www\.)[^\s]+|\[.*?\]\(\/video\?conferenceId=.*?\))/g).map((part, i) => {
                               // Détection des liens de visioconférence
                               if (part.includes('/video?conferenceId=')) {
                                 const confIdMatch = part.match(/conferenceId=([^)]+)/);
                                 const conferenceId = confIdMatch ? confIdMatch[1].split(']')[0] : '';
                                 
                                 return (
                                   <motion.div 
                                     key={i}
                                     whileHover={{ scale: 1.02 }}
                                     className="mt-2 mb-2 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col gap-3"
                                   >
                                     <div className="flex items-center gap-3">
                                       <div className="p-3 bg-blue-500 rounded-xl">
                                         <VideoIcon className="w-6 h-6 text-white" />
                                       </div>
                                       <div>
                                         <p className="font-bold text-sm">Visioconférence lancée</p>
                                         <p className="text-xs opacity-80">Rejoignez la réunion maintenant</p>
                                       </div>
                                     </div>
                                     <Link 
                                       href={`/video?conferenceId=${conferenceId}`}
                                       className="w-full py-2 bg-white text-blue-600 rounded-xl font-bold text-center text-sm hover:bg-blue-50 transition-colors shadow-lg"
                                     >
                                       Rejoindre la réunion
                                     </Link>
                                   </motion.div>
                                 );
                               }

                               if (part.match(/^(https?:\/\/|www\.)/)) {
                                 const url = part.startsWith('www.') ? `https://${part}` : part;
                                 return (
                                   <Link 
                                     key={i} 
                                     href={url} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className={`underline font-bold ${isMine ? 'text-white hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'}`}
                                   >
                                     {part}
                                   </Link>
                                 );
                               }
                               return <span key={i}>{part}</span>;
                             })}
                           </div>
                         )}

                        {message.files && message.files.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.files.map((file) => (
                              <div
                                key={file.id}
                                className={`flex items-center gap-3 min-w-[200px] p-2 rounded-lg ${
                                  isMine ? "bg-white/20" : "bg-slate-100"
                                }`}
                              >
                                {file.type.startsWith("image/") ? (
                                  <Image className="w-5 h-5" />
                                ) : file.type.startsWith("video/") ? (
                                  <Video className="w-5 h-5" />
                                ) : file.type.includes("pdf") ||
                                  file.type.includes("document") ? (
                                  <FileText className="w-5 h-5" />
                                ) : (
                                  <File className="w-5 h-5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-sm">
                                    {file.name}
                                  </p>
                                  <p className="text-xs opacity-70">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className={`p-2 rounded-lg hover:bg-white/20 transition-colors`}
                                  title="Télécharger"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 px-2">
                        <span className="text-xs text-slate-500">
                          {formatTime(message.timestamp)}
                        </span>
                        {isMine && message.status && (
                          <MessageStatus status={message.status} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl w-fit shadow-md"
              >
                <div className="flex gap-1">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-slate-400 rounded-full"
                  />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200">
            {selectedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-slate-100 rounded-lg px-3 py-2 text-sm"
                  >
                    {getFileIcon(file)}
                    <span className="ml-2 mr-2 truncate max-w-32">
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-slate-500 hover:text-red-500 ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Paperclip className="w-5 h-5 text-slate-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              />

              <div className="flex-1 relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Écrivez votre message..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 bg-slate-50 border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                    showEmojiPicker
                      ? "bg-blue-100 text-blue-600"
                      : "hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <div
                      className="fixed inset-0 z-[-1]"
                      onClick={() => setShowEmojiPicker(false)}
                    />
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setNewMessage((prev) => prev + emojiData.emoji);
                        }}
                        width={300}
                        height={400}
                      />
                    </div>
                  </div>
                )}
              </div>

              <motion.button
                onClick={() => handleSendMessage()}
                disabled={!newMessage.trim() && selectedFiles.length === 0}
                whileHover={
                  newMessage.trim() || selectedFiles.length > 0
                    ? { scale: 1.05 }
                    : {}
                }
                whileTap={
                  newMessage.trim() || selectedFiles.length > 0
                    ? { scale: 0.95 }
                    : {}
                }
                className={`
                  p-3 rounded-xl transition-all
                  ${
                    newMessage.trim() || selectedFiles.length > 0
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }
                `}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-100 to-blue-100">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Send className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
              Sélectionnez une conversation
            </h3>
            <p className="text-slate-600">
              Choisissez un contact pour commencer à discuter
            </p>
          </div>
        </div>
      )}

      {/* Create New Conversation Modal */}
      <AnimatePresence>
        {showCreateRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateRoom(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Nouvelle conversation</h2>
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button
                  onClick={() => setNewChatType("DIRECT")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    newChatType === "DIRECT" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Individuel
                </button>
                <button
                  onClick={() => setNewChatType("GROUP")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    newChatType === "GROUP" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Groupe
                </button>
              </div>

              {newChatType === "GROUP" && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Nom du groupe..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 transition-all font-semibold"
                  />
                </div>
              )}

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={newChatType === "DIRECT" ? "Rechercher un contact..." : "Ajouter des membres..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {users
                  .filter(u => 
                    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((user) => {
                    const isSelected = selectedUsers.includes(user.id);
                    
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          if (newChatType === "DIRECT") {
                            handleCreateConversation(user);
                          } else {
                            setSelectedUsers(prev => 
                              isSelected ? prev.filter(id => id !== user.id) : [...prev, user.id]
                            );
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${
                          isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-slate-50 border-transparent"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                          {user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-slate-900">{user.name || "Sans nom"}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        {newChatType === "GROUP" && (
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-slate-200"
                          }`}>
                            {isSelected && <Check className="w-4 h-4" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
              
                {users.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>Aucun contact</p>
                    <p className="text-sm">Ajoutez des contacts depuis l'Annuaire</p>
                  </div>
                )}
              </div>

              {newChatType === "GROUP" && (
                <div className="pt-4 border-t border-slate-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={selectedUsers.length === 0 || !groupName.trim()}
                    onClick={() => handleCreateConversation()}
                    className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
                      selectedUsers.length > 0 && groupName.trim()
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/25"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Créer le groupe ({selectedUsers.length} membres)
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}





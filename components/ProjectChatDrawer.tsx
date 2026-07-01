"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Loader2, 
  Download,
  Smile,
  X
} from "lucide-react";
import ContextDrawer from "./ui/ContextDrawer";
import { Button } from "./ui/Button";
import { pusherClient } from "@/lib/pusher-client";

import UserAvatar from "./ui/UserAvatar";

interface ProjectChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  roomId: string; // The project group chat room ID
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderImage?: string | null;
  timestamp: Date;
  roomId: string;
  files?: any[];
}

export default function ProjectChatDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
  roomId,
}: ProjectChatDrawerProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !session || !roomId) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/chat/messages/${roomId}`);
        if (response.ok) {
          const roomMessages = await response.json();
          setMessages(roomMessages);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    if (!pusherClient) return;

    const channel = pusherClient.subscribe(`presence-room-${roomId}`);

    channel.bind("message", (message: Message) => {
      if (message.roomId === roomId) {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      pusherClient?.unsubscribe(`presence-room-${roomId}`);
    };
  }, [isOpen, session, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || isSending) return;

    setIsSending(true);
    
    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          roomId: roomId,
        }),
      });

      if (response.ok) {
        setNewMessage("");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Chat de Projet - ${projectName}`}
    >
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : messages.length > 0 ? (
            messages.map((msg, i) => {
              const isMine = msg.senderId === session?.user?.id;
              return (
                <div key={msg.id || i} className={`flex gap-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                  <UserAvatar 
                    src={msg.senderImage} 
                    name={msg.senderName} 
                    size="xs" 
                    className="mt-1"
                  />
                  <div className={`max-w-[75%] ${isMine ? "bg-blue-600 text-white rounded-2xl rounded-tr-none" : "bg-white text-slate-900 rounded-2xl rounded-tl-none border border-slate-100"} p-3 shadow-sm`}>
                    {!isMine && <p className="text-[10px] font-bold text-blue-600 mb-1">{msg.senderName}</p>}
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    <p className={`text-[9px] mt-1 text-right font-medium ${isMine ? "text-blue-100/70" : "text-slate-400"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <ImageIcon className="w-12 h-12 opacity-10 mb-2" />
               <p className="text-sm">Commencez la discussion...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez un message..."
              className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium"
            />
            <Button
              variant="primary"
              size="sm"
              className="rounded-xl h-10 w-10 p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
              disabled={isSending || !newMessage.trim()}
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </form>
        </div>
      </div>
    </ContextDrawer>
  );
}

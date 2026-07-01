"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import {
  Search,
  MessageSquare,
  Star,
  UserPlus,
  X,
  Mail,
  Check,
  Clock,
  Bell,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Types
interface Contact {
  id: string;
  contactId: string;
  name: string;
  email: string;
  avatar: string;
  image?: string;
  status: "online" | "away" | "busy" | "offline";
  isFavorite: boolean;
  lastSeen?: Date;
}

interface ContactRequest {
  id: string;
  senderId?: string;
  receiverId?: string;
  name: string;
  email: string;
  avatar: string;
  image?: string;
  message?: string;
  createdAt: Date;
}

// Toast notification type
interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function ContactsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ContactRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "online" | "favorites">("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add contact modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<ContactRequest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ContactRequest | null>(null);
  const [invitationMessage, setInvitationMessage] = useState("");

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    fetchContacts();
  }, [status, session]);

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setReceivedRequests(data.receivedRequests || []);
        setSentRequests(data.sentRequests || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", email: query }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (userSearch) {
        searchUsers(userSearch);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [userSearch]);

  const handleSendRequest = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendRequest",
          userId: selectedUser.id,
          message: invitationMessage,
        }),
      });

      if (response.ok) {
        const newRequest = await response.json();
        setSentRequests([...sentRequests, newRequest]);
        resetAddModal();
        showToast("Invitation envoyée avec succès !");
      } else {
        const error = await response.json();
        showToast(error.error || "Erreur lors de l'envoi de la demande", "error");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande:", error);
      showToast("Erreur lors de l'envoi de la demande", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequest = async (request: ContactRequest) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "acceptRequest",
          userId: request.senderId || request.receiverId,
        }),
      });

      if (response.ok) {
        // Refresh contacts
        await fetchContacts();
        showToast("Contact ajouté avec succès !");
      } else {
        const error = await response.json();
        showToast(error.error || "Erreur lors de l'acceptation", "error");
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRequest = async (request: ContactRequest) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rejectRequest",
          userId: request.senderId || request.receiverId,
        }),
      });

      if (response.ok) {
        setReceivedRequests(receivedRequests.filter((r) => r.id !== request.id));
      }
    } catch (error) {
      console.error("Erreur lors du refus:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce contact?")) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          userId: contactId,
        }),
      });

      if (response.ok) {
        setContacts(contacts.filter((c) => c.contactId !== contactId));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAddModal = () => {
    setShowAddModal(false);
    setUserSearch("");
    setSearchResults([]);
    setSelectedUser(null);
    setInvitationMessage("");
  };

  const toggleFavorite = (contactId: string) => {
    setContacts(
      contacts.map((c) =>
        c.contactId === contactId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
  };

  const handleMessage = (contact: Contact) => {
    window.location.href = `/chat?contactId=${contact.contactId}`;
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "online" && contact.status === "online") ||
      (activeFilter === "favorites" && contact.isFavorite);

    return matchesSearch && matchesFilter;
  });

  const StatusIndicator = ({ status }: { status: Contact["status"] }) => (
    <div
      className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
        status === "online"
          ? "bg-green-500"
          : status === "away"
            ? "bg-yellow-500"
            : status === "busy"
              ? "bg-red-500"
              : "bg-slate-400"
      }`}
    />
  );

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <>
    {/* Toast Notifications */}
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl pointer-events-auto min-w-[280px] max-w-sm ${
              toast.type === "success"
                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-semibold text-sm">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">
              Contacts
            </h1>
            <p className="text-lg text-slate-600">
              {filteredContacts.length} contact{filteredContacts.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={Bell}
              onClick={() => setShowRequestsPanel(true)}
            >
              Demandes {receivedRequests.length > 0 && `(${receivedRequests.length})`}
            </Button>
            <button
              type="button"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              onClick={() => {
                console.log("Button clicked, showAddModal:", true);
                setShowAddModal(true);
              }}
            >
              <UserPlus className="w-5 h-5" />
              Ajouter un contact
            </button>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card hover={false}>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {[
                  { id: "all", label: "Tous", count: contacts.length },
                  {
                    id: "online",
                    label: "En ligne",
                    count: contacts.filter((c) => c.status === "online").length,
                  },
                  {
                    id: "favorites",
                    label: "Favoris",
                    count: contacts.filter((c) => c.isFavorite).length,
                  },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id as any)}
                    className={`
                      px-4 py-2 rounded-lg font-semibold transition-all
                      ${
                        activeFilter === filter.id
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }
                    `}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contacts Grid */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredContacts.map((contact) => (
            <motion.div
              key={contact.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => setSelectedContact(contact)}
            >
              <Card hover className="cursor-pointer relative">
                {/* Favorite Star */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(contact.contactId);
                  }}
                  className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
                >
                  <Star
                    className={`w-5 h-5 ${
                      contact.isFavorite
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-slate-400"
                    }`}
                  />
                </button>

                {/* Avatar & Status */}
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {contact.avatar}
                    </div>
                    <div className="absolute bottom-0 right-0">
                      <StatusIndicator status={contact.status} />
                    </div>
                  </div>

                  <h3 className="text-xl font-display font-bold text-slate-900">
                    {contact.name}
                  </h3>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                </div>

                {/* Status Text */}
                <div className="mb-4">
                  <span
                    className={`text-sm font-medium ${
                      contact.status === "online"
                        ? "text-green-600"
                        : "text-slate-500"
                    }`}
                  >
                    {contact.status === "online" ? "● En ligne" : "○ Hors ligne"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessage(contact);
                    }}
                    className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-colors group"
                  >
                    <MessageSquare className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(contact.contactId);
                    }}
                    className="p-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-xl transition-colors group"
                  >
                    <Star className={`w-5 h-5 mx-auto group-hover:scale-110 transition-transform ${contact.isFavorite ? 'fill-yellow-500' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Voulez-vous supprimer ce contact?")) {
                        handleRemoveContact(contact.contactId);
                      }
                    }}
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors group"
                  >
                    <Trash2 className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredContacts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <Search className="w-16 h-16 text-slate-400" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
              Aucun contact trouvé
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? "Essayez de modifier vos critères de recherche"
                : "Ajoutez des contacts pour commencer"}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                icon={UserPlus}
                onClick={() => setShowAddModal(true)}
              >
                Ajouter un contact
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Contact Detail Modal */}
      <AnimatePresence>
        {selectedContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedContact(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Détails du contact
                </h2>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {selectedContact.avatar}
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <StatusIndicator status={selectedContact.status} />
                  </div>
                </div>

                <h3 className="text-2xl font-display font-bold text-slate-900 mb-1">
                  {selectedContact.name}
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">
                    {selectedContact.email}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  icon={MessageSquare}
                  onClick={() => handleMessage(selectedContact)}
                  fullWidth
                >
                  Message
                </Button>
                <Button
                  variant={selectedContact.isFavorite ? "danger" : "outline"}
                  icon={Star}
                  onClick={() => toggleFavorite(selectedContact.contactId)}
                  fullWidth
                >
                  {selectedContact.isFavorite ? "Retirer" : "Favori"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requests Panel */}
      <AnimatePresence>
        {showRequestsPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRequestsPanel(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Demandes de contact
                </h2>
                <button
                  onClick={() => setShowRequestsPanel(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Received Requests */}
              {receivedRequests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Demandes reçues ({receivedRequests.length})
                  </h3>
                  <div className="space-y-4">
                    {receivedRequests.map((request) => (
                      <Card key={request.id} hover={false}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                            {request.avatar}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">
                              {request.name}
                            </h4>
                            <p className="text-sm text-slate-600">{request.email}</p>
                            {request.message && (
                              <p className="text-sm text-slate-700 mt-2 italic">
                                "{request.message}"
                              </p>
                            )}

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleAcceptRequest(request)}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Accepter
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request)}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all flex items-center gap-1"
                              >
                                <X className="w-4 h-4" />
                                Refuser
                              </button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Sent Requests */}
              {sentRequests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Demandes envoyées ({sentRequests.length})
                  </h3>
                  <div className="space-y-4">
                    {sentRequests.map((request) => (
                      <Card key={request.id} hover={false}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                            {request.avatar}
                          </div>

                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">
                              {request.name}
                            </h4>
                            <p className="text-sm text-slate-600">{request.email}</p>
                            <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              En attente de réponse
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {receivedRequests.length === 0 && sentRequests.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600">Aucune demande en attente</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAddModal}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Ajouter un contact
                </h2>
                <button
                  onClick={resetAddModal}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Rechercher un utilisateur
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && !selectedUser && (
                  <div className="mt-2 border-2 border-slate-200 rounded-xl max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearch("");
                          setSearchResults([]);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {user.name || "Sans nom"}
                          </p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected User */}
              {selectedUser && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                        {selectedUser.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {selectedUser.name || "Sans nom"}
                        </p>
                        <p className="text-sm text-slate-600">
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="p-2 hover:bg-white rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Message (optionnel)
                </label>
                <textarea
                  value={invitationMessage}
                  onChange={(e) => setInvitationMessage(e.target.value)}
                  placeholder="Ajoutez un message personnel..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={resetAddModal}
                  fullWidth
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  icon={Send}
                  onClick={handleSendRequest}
                  disabled={!selectedUser || isSubmitting}
                  loading={isSubmitting}
                  fullWidth
                >
                  Envoyer la demande
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

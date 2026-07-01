"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Phone,
  Video,
  MessageSquare,
  Star,
  UserPlus,
  X,
  Mail,
  Briefcase,
  MapPin,
  MoreVertical,
  Check,
  Clock,
} from "lucide-react";
import { Card } from "components/ui/Card";
import { Button } from "components/ui/Button";
import Input from "components/ui/Input";

// Types
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  status: "online" | "away" | "busy" | "offline";
  isFavorite: boolean;
  lastSeen?: Date;
}

interface ContactRequest {
  id: string;
  sender: Contact;
  message?: string;
  createdAt: Date;
}

// Mock Data
const mockContacts: Contact[] = [
  {
    id: "1",
    firstName: "Alice",
    lastName: "Martin",
    avatar: "AM",
    email: "alice.martin@teamflow.com",
    phone: "+237 6 XX XX XX XX",
    jobTitle: "Développeuse Frontend",
    department: "Développement",
    status: "online",
    isFavorite: true,
  },
  {
    id: "2",
    firstName: "Bob",
    lastName: "Dupont",
    avatar: "BD",
    email: "bob.dupont@teamflow.com",
    jobTitle: "Designer UI/UX",
    department: "Design",
    status: "offline",
    isFavorite: false,
    lastSeen: new Date(Date.now() - 3600000),
  },
  {
    id: "3",
    firstName: "Claire",
    lastName: "Durand",
    avatar: "CD",
    email: "claire.durand@teamflow.com",
    phone: "+237 6 XX XX XX XX",
    jobTitle: "Chef de Projet",
    department: "Management",
    status: "online",
    isFavorite: true,
  },
  {
    id: "4",
    firstName: "David",
    lastName: "Lee",
    avatar: "DL",
    email: "david.lee@teamflow.com",
    jobTitle: "Développeur Backend",
    department: "Développement",
    status: "away",
    isFavorite: false,
  },
  {
    id: "5",
    firstName: "Emma",
    lastName: "Wilson",
    avatar: "EW",
    email: "emma.wilson@teamflow.com",
    jobTitle: "Product Manager",
    department: "Produit",
    status: "busy",
    isFavorite: false,
  },
];

const mockRequests: ContactRequest[] = [
  {
    id: "1",
    sender: {
      id: "10",
      firstName: "Frank",
      lastName: "Martin",
      avatar: "FM",
      email: "frank.martin@external.com",
      jobTitle: "Client",
      department: "External",
      status: "online",
      isFavorite: false,
    },
    message: "Bonjour, j'aimerais discuter du projet X",
    createdAt: new Date(Date.now() - 7200000),
  },
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [requests, setRequests] = useState<ContactRequest[]>(mockRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "online" | "favorites"
  >("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);

  const handleCall = (contact: Contact, type: "audio" | "video") => {
    console.log(`${type} call to ${contact.firstName} ${contact.lastName}`);
    // TODO: Implement call functionality
  };

  const handleMessage = (contact: Contact) => {
    console.log(`Message to ${contact.firstName} ${contact.lastName}`);
    // TODO: Redirect to messages
  };

  const toggleFavorite = (contactId: string) => {
    setContacts(
      contacts.map((c) =>
        c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c,
      ),
    );
  };

  const handleAcceptRequest = (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      setContacts([...contacts, { ...request.sender, isFavorite: false }]);
      setRequests(requests.filter((r) => r.id !== requestId));
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(requests.filter((r) => r.id !== requestId));
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  return (
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
              {filteredContacts.length} contact
              {filteredContacts.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={Clock}
              onClick={() => setShowRequestsPanel(true)}
            >
              Demandes {requests.length > 0 && `(${requests.length})`}
            </Button>
            <Button
              variant="primary"
              icon={UserPlus}
              onClick={() => setShowAddModal(true)}
            >
              Ajouter un contact
            </Button>
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
                    toggleFavorite(contact.id);
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
                    {contact.firstName} {contact.lastName}
                  </h3>
                  <p className="text-sm text-slate-600">{contact.jobTitle}</p>
                  <p className="text-xs text-slate-500">{contact.department}</p>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                </div>

                {/* Status Text */}
                <div className="mb-4">
                  <span
                    className={`text-sm font-medium ${
                      contact.status === "online"
                        ? "text-green-600"
                        : contact.status === "away"
                          ? "text-yellow-600"
                          : contact.status === "busy"
                            ? "text-red-600"
                            : "text-slate-500"
                    }`}
                  >
                    {contact.status === "online"
                      ? "● En ligne"
                      : contact.status === "away"
                        ? "● Absent"
                        : contact.status === "busy"
                          ? "● Occupé"
                          : `Vu ${contact.lastSeen ? new Date(contact.lastSeen).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "récemment"}`}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCall(contact, "audio");
                    }}
                    className="p-3 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors group"
                  >
                    <Phone className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCall(contact, "video");
                    }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors group"
                  >
                    <Video className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessage(contact);
                    }}
                    className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl transition-colors group"
                  >
                    <MessageSquare className="w-5 h-5 mx-auto group-hover:scale-110 transition-transform" />
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
            <p className="text-slate-600">
              Essayez de modifier vos critères de recherche
            </p>
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
                  {selectedContact.firstName} {selectedContact.lastName}
                </h3>
                <p className="text-slate-600">{selectedContact.jobTitle}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">
                    {selectedContact.email}
                  </span>
                </div>
                {selectedContact.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-700">
                      {selectedContact.phone}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-700">
                    {selectedContact.department}
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
                  onClick={() => toggleFavorite(selectedContact.id)}
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
                  Demandes de contact ({requests.length})
                </h2>
                <button
                  onClick={() => setShowRequestsPanel(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} hover={false}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {request.sender.avatar}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">
                          {request.sender.firstName} {request.sender.lastName}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {request.sender.jobTitle}
                        </p>
                        {request.message && (
                          <p className="text-sm text-slate-700 mt-2 italic">
                            "{request.message}"
                          </p>
                        )}

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                          >
                            <Check className="w-4 h-4 inline mr-1" />
                            Accepter
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all"
                          >
                            <X className="w-4 h-4 inline mr-1" />
                            Refuser
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {requests.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-600">Aucune demande en attente</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

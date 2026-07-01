"use client";
/**
 * Page : Annuaire de l'Équipe
 * Fonction : Permet de gérer les contacts, rechercher des membres et gérer les invitations.
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageSquare,
  Star,
  UserPlus,
  X,
  Mail,
  Clock,
  Loader2,
  Bell,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowLeft,
  Users,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import UserAvatar from "@/components/ui/UserAvatar";

// Définition des interfaces pour le typage TypeScript
interface Contact {
  id: string;
  contactId: string;
  name: string;
  email: string;
  avatar: string;
  image?: string;
  status: "online" | "away" | "busy" | "offline";
  isFavorite: boolean;
}

interface ContactRequest {
  id: string;
  senderId?: string;
  receiverId?: string;
  name: string;
  email: string;
  avatar: string;
  message?: string;
  createdAt: string;
}

export default function DirectoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // États pour gérer les données et l'interface (React Hooks)
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ContactRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ContactRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "online" | "favorites">("all");
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Contact | null>(null);
  const [invitationMessage, setInvitationMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Charge les données initiales (contacts et demandes) depuis l'API
   */
  const fetchData = async () => {
    try {
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
        setReceivedRequests(data.receivedRequests || []);
        setSentRequests(data.sentRequests || []);
      }
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  /**
   * Envoie une invitation de contact
   */
  const handleSendRequest = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendRequest",
          userId: selectedUser.email,
          message: invitationMessage,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Erreur lors de l'envoi");
        return;
      }
      
      // Mise à jour locale pour éviter un rechargement complet
      setSentRequests(prev => [...prev, {
        id: data.id,
        receiverId: data.receiverId,
        name: data.name,
        email: data.email,
        avatar: data.avatar || data.email.substring(0, 2).toUpperCase(),
        message: invitationMessage,
        createdAt: new Date().toISOString(),
      }]);
      
      setSuccessMessage(`Invitation envoyée à ${data.name || data.email} !`);
      setUserSearch("");
      setSelectedUser(null);
      setInvitationMessage("");
      
      // Fermeture automatique du modal après succès
      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMessage(null);
      }, 2500);
    } catch (err) {
      setError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Accepte une demande d'invitation reçue
   */
  const handleAcceptRequest = async (request: ContactRequest) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "acceptRequest", userId: request.senderId || request.email }),
      });
      if (response.ok) {
        // Supprime la demande de la liste locale et recharge les contacts
        setReceivedRequests(receivedRequests.filter((r) => r.id !== request.id));
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Refuse une demande d'invitation reçue
   */
  const handleRejectRequest = async (request: ContactRequest) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rejectRequest", userId: request.senderId || request.email }),
      });
      if (response.ok) {
        setReceivedRequests(receivedRequests.filter((r) => r.id !== request.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Supprime un contact existant
   */
  const handleRemoveContact = async (contactId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce contact ?")) return;
    setIsSubmitting(true);
    try {
      // Note : Utilisation de l'API DELETE avec Paramètre
      const response = await fetch(`/api/contacts?contactId=${contactId}`, { method: "DELETE" });
      if (response.ok) {
        setContacts(contacts.filter((c) => c.contactId !== contactId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gère la recherche d'utilisateur par email dans le modal d'ajout
   */
  const handleUserSearch = (email: string) => {
    setUserSearch(email);
    // Simulation simple de sélection (devrait idéalement appeler une API de recherche)
    if (email.includes('@') && email.length > 5) {
      setSelectedUser({
        id: email,
        contactId: email,
        name: email.split('@')[0],
        email: email,
        avatar: email.substring(0, 2).toUpperCase(),
        status: "offline",
        isFavorite: false,
      });
    } else {
      setSelectedUser(null);
    }
  };

  // Réinitialise l'état du modal à la fermeture
  const resetAddModal = () => {
    setShowAddModal(false);
    setUserSearch("");
    setSelectedUser(null);
    setInvitationMessage("");
    setError(null);
    setSuccessMessage(null);
  };

  // Filtrage des contacts selon la recherche et les filtres actifs
  const filteredContacts = contacts.filter((c) => {
    const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const filter = activeFilter === "all" || 
                  (activeFilter === "online" && c.status === "online") || 
                  (activeFilter === "favorites" && c.isFavorite);
    return matchesQuery && filter;
  });

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <DashboardWrapper>
      <div className="relative space-y-8">
        {/* Cercles de lumière (Effet Glassmorphism) */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* En-tête de la page */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-4 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:bg-slate-50 transition-all shadow-sm">
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </button>
            <div>
              <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight">Annuaire <span className="text-blue-600">Equipe</span></h1>
              <p className="text-slate-500 mt-2 font-bold flex items-center gap-2">
                <Users className="w-4 h-4" />
                {contacts.length} contact{contacts.length > 1 ? 's' : ''} • {contacts.filter(c => c.status === 'online').length} en ligne
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Bouton des demandes avec indicateur de notification */}
            <Button variant="outline" className="rounded-2xl border-2 px-6 h-auto py-4 relative group" onClick={() => setShowRequestsPanel(true)}>
              <Bell className="w-5 h-5 mr-3 group-hover:animate-swing transition-all" />
              Demandes
              {receivedRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                  {receivedRequests.length}
                </span>
              )}
            </Button>
            <Button variant="primary" className="rounded-2xl px-6 h-auto py-4 font-black uppercase tracking-widest shadow-xl shadow-blue-500/20" onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-5 h-5 mr-3" />
              Ajouter
            </Button>
          </div>
        </div>

        {/* Barre de Recherche et Filtres */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-500" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white/60 backdrop-blur-md border-2 border-white rounded-3xl focus:border-blue-400 transition-all font-bold shadow-sm"
            />
          </div>
          <div className="flex gap-2 p-1.5 bg-white/60 backdrop-blur-md border-2 border-white rounded-3xl shadow-sm">
            {['all', 'online', 'favorites'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f as any)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/50'}`}
              >
                {f === 'all' ? 'Tous' : f === 'online' ? 'En ligne' : 'Favoris'}
              </button>
            ))}
          </div>
        </div>

        {/* Grille des Contacts */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredContacts.map((contact) => (
              <motion.div key={contact.contactId} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <Card className="p-8 border-2 border-white/50 bg-white/50 backdrop-blur-xl rounded-[2.5rem] hover:shadow-2xl transition-all h-full group">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                        <UserAvatar src={contact.image || contact.avatar} name={contact.name} size="lg" className="w-full h-full" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-lg ${contact.status === 'online' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                    <h3 className="text-2xl font-display font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{contact.name}</h3>
                    <p className="text-sm font-bold text-slate-400 mb-8">{contact.email}</p>
                    
                    {/* Actions rapides sur le contact */}
                    <div className="grid grid-cols-3 gap-4 w-full pt-6 border-t border-slate-100">
                      <button onClick={() => router.push("/chat")} className="flex flex-col items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-2xl text-purple-600 transition-all group/btn">
                        <MessageSquare className="w-5 h-5 group-hover/btn:scale-110" />
                        <span className="text-[8px] font-black uppercase">Chat</span>
                      </button>
                      <button onClick={() => fetchData()} className="flex flex-col items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-2xl text-blue-600 transition-all group/btn">
                        <ShieldCheck className="w-5 h-5 group-hover/btn:scale-110" />
                        <span className="text-[8px] font-black uppercase">Statut</span>
                      </button>
                      <button onClick={() => handleRemoveContact(contact.contactId)} className="flex flex-col items-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-2xl text-red-600 transition-all group/btn">
                        <Trash2 className="w-5 h-5 group-hover/btn:scale-110" />
                        <span className="text-[8px] font-black uppercase">Suppr.</span>
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* État vide (Aucun résultat) */}
        {filteredContacts.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 opacity-30"><Users className="w-12 h-12" /></div>
            <h3 className="text-2xl font-black text-slate-700">Aucun contact trouvé</h3>
            <p className="text-slate-500 font-bold mt-2">Élargissez votre cercle de collaboration.</p>
          </div>
        )}
      </div>

      {/* Modal d'ajout de contact */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={resetAddModal} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900">Ajouter un contact</h2>
                <button onClick={resetAddModal} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-6 h-6" /></button>
              </div>
              
              <div className="space-y-6">
                {/* Messages de retour (Succès / Erreur) */}
                {successMessage && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="font-bold text-green-700 text-sm">{successMessage}</p>
                  </div>
                )}
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="font-bold text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {!successMessage && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Email de l'utilisateur</label>
                      <input type="email" value={userSearch} onChange={(e) => handleUserSearch(e.target.value)} placeholder="email@exemple.com" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-blue-500 outline-none transition-all" />
                    </div>
                    {/* Aperçu de l'utilisateur trouvé */}
                    {selectedUser && (
                      <div className="p-4 bg-blue-50/50 rounded-2xl border-2 border-blue-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 shadow-inner">
                        <UserAvatar name={selectedUser.name} size="sm" />
                        <div className="flex-1">
                          <p className="font-black text-slate-800 uppercase text-xs">{selectedUser.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">{selectedUser.email}</p>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Message (optionnel)</label>
                      <textarea value={invitationMessage} onChange={(e) => setInvitationMessage(e.target.value)} placeholder="Ajoutez un petit mot..." rows={3} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-blue-500 outline-none transition-all resize-none" />
                    </div>
                    <Button variant="primary" className="w-full py-5 rounded-2xl font-black uppercase tracking-widest" disabled={!selectedUser || isSubmitting} onClick={handleSendRequest}>
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Envoyer l'invitation"}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Panneau des demandes entrantes */}
      <AnimatePresence>
        {showRequestsPanel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowRequestsPanel(false)} />
            <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-black mb-8 border-b pb-4">Demandes d'invitation</h2>
              {receivedRequests.length === 0 ? (
                <p className="text-center py-12 text-slate-400 font-bold">Aucune demande en attente</p>
              ) : (
                <div className="space-y-4">
                  {receivedRequests.map(r => (
                    <div key={r.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between gap-4 border-2 border-transparent hover:border-blue-100 transition-all">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={r.name} size="xs" />
                        <div>
                          <p className="font-black text-slate-800 text-[10px] uppercase">{r.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold italic">{r.message || "Pas de message"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAcceptRequest(r)} className="p-2 bg-green-500 text-white rounded-lg hover:shadow-lg transition-all shadow-green-500/20"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleRejectRequest(r)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardWrapper>
  );
}

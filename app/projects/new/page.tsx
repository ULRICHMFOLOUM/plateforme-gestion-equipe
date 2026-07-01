"use client";
/**
 * Page : Création d'un Nouveau Projet
 * Fonction : Interface permettant à l'utilisateur de définir les paramètres d'un projet et d'inviter des membres.
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  FolderPlus, 
  Layout, 
  Settings, 
  Target, 
  Sparkles,
  CheckCircle2,
  X,
  Loader2
} from "lucide-react";
import Link from "next/link";
import UserSelector from "@/components/UserSelector";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import DashboardWrapper from "@/components/layout/DashboardWrapper";

export default function NewProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Sécurité : Redirection si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // États locaux pour gérer le formulaire et le chargement
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "blue",
  });
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  // Palette de couleurs prédéfinie pour l'identité visuelle du projet
  const colors = [
    { id: "blue", class: "bg-blue-500 shadow-blue-500/30" },
    { id: "green", class: "bg-emerald-500 shadow-emerald-500/30" },
    { id: "orange", class: "bg-orange-500 shadow-orange-500/30" },
    { id: "purple", class: "bg-purple-500 shadow-purple-500/30" },
    { id: "red", class: "bg-red-500 shadow-red-500/30" },
  ];

  /**
   * Gère la soumission du formulaire vers l'API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsLoading(true);
    try {
      // Envoi des données du projet et de la liste des membres sélectionnés
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          members: selectedUsers.map((user) => ({
            id: user.id,
            role: user.role || "CONTRIBUTOR",
          })),
        }),
      });
      
      if (response.ok) {
        // Redirection vers la liste des projets après succès
        router.push("/projects");
      } else {
        const error = await response.text();
        alert(`Erreur création: ${error}`);
      }
    } catch (error) {
      console.error("Erreur réseau lors de la création du projet:", error);
      alert("Une erreur réseau est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage de l'écran de chargement pendant la session
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <DashboardWrapper>
      <div className="relative max-w-4xl mx-auto space-y-10">
        {/* Effets visuels de fond (Glassmorphism) */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/10 blur-[150px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-400/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* En-tête : Titre et bouton retour */}
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-4 bg-white border-2 border-slate-100 rounded-3xl hover:bg-slate-50 transition-all shadow-sm group">
            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </button>
          <div>
            <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight">Initier un <span className="text-blue-600">Projet</span></h1>
            <p className="text-slate-500 mt-2 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Créez un nouvel espace de travail pour votre équipe
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne Gauche : Informations du Projet */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="p-10 border-2 border-white/50 bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-500/5">
                <div className="space-y-8">
                  {/* Champ : Nom du projet */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Nom du Projet</label>
                    <div className="relative">
                      <FolderPlus className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Refonte du site web 2026"
                        className="w-full pl-16 pr-6 py-5 bg-white/80 border-2 border-slate-100 rounded-3xl text-xl font-black text-slate-900 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Champ : Description et Objectifs */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Objectifs & Description</label>
                    <div className="relative">
                      <Target className="absolute left-6 top-6 w-6 h-6 text-slate-300" />
                      <textarea
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Quels sont les enjeux de ce projet ?"
                        className="w-full pl-16 pr-6 py-5 bg-white/80 border-2 border-slate-100 rounded-3xl text-lg font-bold text-slate-900 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-300"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sélection des Collaborateurs */}
              <Card className="p-10 border-2 border-white/50 bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-500/5">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Equipe du Projet</h3>
                    <p className="text-xs font-bold text-slate-400">Invitez vos collaborateurs et définissez leurs rôles</p>
                  </div>
                </div>

                <UserSelector
                  selectedUsers={selectedUsers}
                  onUsersChange={setSelectedUsers}
                  placeholder="Rechercher par nom ou email..."
                  maxUsers={25}
                  showRoleSelection={true}
                />
              </Card>
            </div>

            {/* Colonne Droite : Paramètres et Identité */}
            <div className="space-y-8">
              <Card className="p-10 border-2 border-white/50 bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-blue-500/5">
                <div className="mb-8">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Identité Visuelle</label>
                  <div className="flex flex-wrap gap-4">
                    {colors.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c.id })}
                        className={`w-12 h-12 rounded-2xl ${c.class} transition-all relative ${formData.color === c.id ? 'ring-4 ring-slate-900 scale-110' : 'hover:scale-105 opacity-60'}`}
                      >
                        {formData.color === c.id && <CheckCircle2 className="w-6 h-6 text-white absolute inset-0 m-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paramètres par défaut activés */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 uppercase text-[10px]">Chat de Groupe</p>
                      <p className="text-[10px] font-bold text-slate-400">Activé automatiquement</p>
                    </div>
                    <div className="w-10 h-6 bg-blue-500 rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800 uppercase text-[10px]">Visibilité</p>
                      <p className="text-[10px] font-bold text-slate-400">Membres uniquement</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Bouton de Soumission */}
              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  className="w-full h-auto py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 text-lg group"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  ) : (
                    <>
                      Lancer le projet
                      <Plus className="w-6 h-6 ml-3 group-hover:rotate-90 transition-transform duration-500" />
                    </>
                  )}
                </Button>
                <Link href="/projects" className="block text-center text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors py-4">
                  Retourner à la liste
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardWrapper>
  );
}

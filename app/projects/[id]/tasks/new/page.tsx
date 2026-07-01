"use client";
export const dynamic = 'force-dynamic';

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Type, 
  AlignLeft, 
  Flag, 
  Calendar as CalendarIcon, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function NewTaskPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const { id: projectId } = params as { id: string };
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assigneeId: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchProjectMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (response.ok) {
        const data = await response.json();
        const allMembers = [];
        
        if (data.owner) {
          allMembers.push({
            id: data.owner.id,
            name: data.owner.name,
            email: data.owner.email,
            isOwner: true
          });
        }
        
        if (data.members) {
          data.members.forEach((m: any) => {
            if (m.userId !== data.owner.id) {
              allMembers.push({
                id: m.userId,
                name: m.name,
                email: m.email,
                isOwner: false
              });
            }
          });
        }
        
        setMembers(allMembers);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des membres:", error);
    }
  }, [projectId]);

  useEffect(() => {
    if (status === "authenticated" && session && projectId) {
      fetchProjectMembers();
    }
  }, [projectId, status, session, fetchProjectMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          projectId,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        }),
      });

      if (response.ok) {
        router.push(`/projects/${projectId}/kanban`);
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de la création de la tâche");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur est survenue lors de la création de la tâche");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated") {
    return null; // Redirect is handled by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href={`/projects/${projectId}/kanban`}>
            <Button variant="ghost" icon={ArrowLeft}>
              Retour au Kanban
            </Button>
          </Link>
        </motion.div>

        {/* Form Card */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 border border-white overflow-hidden"
        >
          {/* Header section with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-10 text-white">
            <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Plus className="w-6 h-6" />
              </div>
              Nouvelle Tâche
            </h1>
            <p className="text-blue-50 font-medium">
              Définissez les détails de votre nouvelle mission pour l'équipe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Title Field */}
            <div className="space-y-2">
              <label htmlFor="title" className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <Type className="w-4 h-4 text-blue-500" />
                TITRE DE LA TÂCHE
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="Ex: Finaliser le design de l'accueil..."
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <AlignLeft className="w-4 h-4 text-blue-500" />
                DESCRIPTION
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900 placeholder:text-slate-400 resize-none"
                placeholder="Détaillez les objectifs et les résultats attendus..."
              />
            </div>

            {/* Grid for settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Priority */}
              <div className="space-y-2">
                <label htmlFor="priority" className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <Flag className="w-4 h-4 text-blue-500" />
                  PRIORITÉ
                </label>
                <div className="relative">
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-slate-900 appearance-none"
                  >
                    <option value="LOW">🔵 Basse</option>
                    <option value="MEDIUM">🟡 Moyenne</option>
                    <option value="HIGH">🔴 Haute</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label htmlFor="dueDate" className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <CalendarIcon className="w-4 h-4 text-blue-500" />
                  ÉCHÉANCE
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Assignee */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="assigneeId" className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  ASSIGNATION
                </label>
                <div className="relative">
                  <select
                    id="assigneeId"
                    name="assigneeId"
                    value={formData.assigneeId}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold text-slate-900 appearance-none"
                  >
                    <option value="">👤 Non assignée</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.isOwner ? "👑" : "👥"} {member.name || member.email} {member.isOwner ? "(Propriétaire)" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-slate-100">
              <Link href={`/projects/${projectId}/kanban`} className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full h-14 rounded-2xl font-bold">
                  Annuler
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className="w-full sm:w-auto h-14 px-10 rounded-2xl font-bold shadow-xl shadow-blue-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Création...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Créer la tâche</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Edit,
  Camera,
  Save,
  Shield,
  Layers,
  Check,
  Tag,
  Clock,
  Sparkles,
  Activity,
  Plus,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import UserAvatar from "@/components/ui/UserAvatar";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  role: string;
  status: "online" | "away" | "busy" | "offline";
  timezone: string;
  language: string;
  skills: string[];
  createdAt: Date;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const [user, setUser] = useState<UserProfile>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    avatar: "",
    bio: "",
    phone: "",
    department: "",
    jobTitle: "",
    role: "Utilisateur",
    status: "online",
    timezone: "Africa/Douala (GMT+1)",
    language: "fr",
    skills: ["React", "TypeScript", "Next.js", "Gestion de Projet"],
    createdAt: new Date(),
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (session?.user) {
      const userAny = session.user as any;
      setUser((prev) => ({
        ...prev,
        id: session.user.id || "",
        firstName: session.user.name?.split(" ")[0] || "",
        lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
        email: session.user.email || "",
        avatar: session.user.image || "",
        bio: userAny.bio || "",
        phone: userAny.phone || "",
        department: userAny.department || "",
        jobTitle: userAny.jobTitle || "",
        role: session.user.role || "Utilisateur",
        status: userAny.status || "online",
        timezone: userAny.timezone || "Africa/Douala (GMT+1)",
        language: userAny.language || "fr",
        createdAt: userAny.createdAt ? new Date(userAny.createdAt) : new Date(),
      }));
    }
  }, [session]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !user.skills.includes(newSkillInput.trim())) {
      setUser((prev) => ({ ...prev, skills: [...prev.skills, newSkillInput.trim()] }));
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setUser((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("firstName", user.firstName || "");
      formData.append("lastName", user.lastName || "");
      formData.append("bio", user.bio || "");
      formData.append("phone", user.phone || "");
      formData.append("department", user.department || "");
      formData.append("jobTitle", user.jobTitle || "");
      formData.append("timezone", user.timezone || "");
      formData.append("language", user.language || "");

      if (selectedFile) {
        formData.append("image", selectedFile);
      } else {
        formData.append("existingImage", user.avatar || "");
      }

      const response = await fetch("/api/user/profile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Erreur lors de la sauvegarde du profil";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Dispatch global event so all UserAvatar components update instantly across app
      window.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: { name: data.user.name, image: data.user.image, status: user.status },
        })
      );

      // Update next-auth session
      await update({ name: data.user.name, image: data.user.image });

      // Update local state
      setUser((prev) => ({ ...prev, avatar: data.user.image || prev.avatar }));
      setIsEditing(false);
      setAvatarPreview(null);
      setSelectedFile(null);
      alert("Profil mis à jour avec succès !");
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(error.message || "Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      alert("Veuillez remplir tous les champs de mot de passe.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur de mot de passe");
      alert("Mot de passe mis à jour !");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    setSelectedFile(null);
  };

  const tabs = [
    { id: "profile", label: "Profil & Compétences", icon: User },
    { id: "activity", label: "Activité & Statut", icon: Activity },
    { id: "security", label: "Sécurité & Mot de passe", icon: Shield },
  ];

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  const displayAvatar = avatarPreview || user.avatar;
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return (
    <DashboardWrapper>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* ── Header Card ── */}
        <Card className="p-8 md:p-10 border-none shadow-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden rounded-[2.5rem]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 text-center sm:text-left">
              
              {/* Centralized Avatar with Camera Overlay */}
              <div className="relative group">
                <UserAvatar
                  src={displayAvatar}
                  name={fullName}
                  userId={user.id}
                  size="2xl"
                  showStatus={true}
                  status={user.status}
                />
                
                {/* Camera upload overlay */}
                <label
                  className={`absolute inset-0 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    isEditing
                      ? "bg-black/50"
                      : "bg-transparent group-hover:bg-black/50"
                  }`}
                >
                  <Camera
                    className={`w-8 h-8 text-white drop-shadow transition-opacity ${
                      isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* User Title Info */}
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
                    {fullName}
                  </h1>
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full text-xs font-black uppercase tracking-widest">
                    {user.role}
                  </span>
                </div>
                
                <p className="text-slate-300 font-medium text-base flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span>{user.jobTitle || "Collaborateur"}</span>
                  {user.department && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-blue-400 font-bold">{user.department}</span>
                    </>
                  )}
                </p>

                {selectedFile && (
                  <p className="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Sparkles className="w-4 h-4 animate-spin" /> Nouvelle photo sélectionnée — cliquez sur Sauvegarder
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center md:justify-end gap-3">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    className="rounded-2xl px-6 text-white hover:bg-white/10"
                    onClick={handleCancel}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    className="rounded-2xl px-8 bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/30"
                    onClick={handleSave}
                    loading={isLoading}
                    icon={Save}
                  >
                    Sauvegarder
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="rounded-2xl px-8 border-white/20 text-white hover:bg-white/10"
                  onClick={() => setIsEditing(true)}
                  icon={Edit}
                >
                  Modifier le profil
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* ── Navigation Tabs ── */}
        <div className="flex gap-3 bg-white/60 backdrop-blur-md p-2 rounded-3xl border border-slate-200/80 w-full sm:w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-sm tracking-tight transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-xl translate-y-[-1px]"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              }`}
            >
              <tab.icon
                className={`w-4 h-4 ${
                  activeTab === tab.id ? "text-blue-400" : "text-slate-400"
                }`}
              />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Profile & Skills Tab ── */}
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Bio & Skills */}
                <div className="lg:col-span-8 space-y-8">
                  <Card className="p-8 md:p-10 border-none shadow-xl shadow-slate-100">
                    <h3 className="text-2xl font-display font-black text-slate-900 mb-8 border-l-4 border-blue-600 pl-4 flex items-center justify-between">
                      <span>Biographie &amp; Compétences</span>
                      <Sparkles className="w-5 h-5 text-blue-500" />
                    </h3>

                    <div className="space-y-8">
                      {/* Bio */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                          À propos de moi / Biographie
                        </label>
                        {isEditing ? (
                          <textarea
                            value={user.bio}
                            onChange={(e) =>
                              setUser({ ...user, bio: e.target.value })
                            }
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-3xl py-4 px-6 text-base font-medium transition-all min-h-[140px] outline-none"
                            placeholder="Décrivez votre rôle, vos passions et vos projets..."
                          />
                        ) : (
                          <p className="text-lg font-medium text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-3xl italic">
                            {user.bio || "Aucune biographie ajoutée."}
                          </p>
                        )}
                      </div>

                      {/* Skills / Tags */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-600" />
                          Compétences &amp; Expertises
                        </label>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {user.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl text-sm font-bold flex items-center gap-2"
                            >
                              {skill}
                              {isEditing && (
                                <button
                                  onClick={() => handleRemoveSkill(skill)}
                                  className="text-blue-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>

                        {isEditing && (
                          <div className="flex gap-3 max-w-md">
                            <input
                              type="text"
                              value={newSkillInput}
                              onChange={(e) => setNewSkillInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                              placeholder="Ajouter une compétence..."
                              className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl py-2.5 px-4 text-sm font-bold outline-none"
                            />
                            <Button
                              variant="outline"
                              onClick={handleAddSkill}
                              icon={Plus}
                              className="rounded-2xl"
                            >
                              Ajouter
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Job Title & Department */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                            Département / Équipe
                          </label>
                          {isEditing ? (
                            <Input
                              value={user.department}
                              onChange={(e) =>
                                setUser({ ...user, department: e.target.value })
                              }
                              className="rounded-2xl py-3"
                              placeholder="Ex: Ingénierie"
                            />
                          ) : (
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <Layers className="w-5 h-5 text-blue-600" />
                              </div>
                              <span className="text-base font-bold text-slate-800">
                                {user.department || "Non spécifié"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                            Fuseau Horaire
                          </label>
                          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <MapPin className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="text-base font-bold text-slate-800">
                              {user.timezone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right Column: Contact Details Card */}
                <div className="lg:col-span-4 space-y-8">
                  <Card className="p-8 border-none shadow-xl shadow-slate-100 bg-white">
                    <h3 className="text-xl font-display font-black text-slate-900 mb-6 flex items-center gap-3">
                      <span className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </span>
                      Coordonnées
                    </h3>
                    <div className="space-y-4">
                      {/* Email */}
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="p-2 bg-blue-100 rounded-xl flex-shrink-0">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Email professionnel
                          </p>
                          <p className="text-sm font-bold text-slate-800 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="p-2 bg-emerald-100 rounded-xl flex-shrink-0">
                          <Phone className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Téléphone
                          </p>
                          {isEditing ? (
                            <input
                              value={user.phone}
                              onChange={(e) =>
                                setUser({ ...user, phone: e.target.value })
                              }
                              className="mt-1 w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl py-2 px-3 text-sm font-bold outline-none"
                              placeholder="+237 6XX XXX XXX"
                            />
                          ) : (
                            <p className="text-sm font-bold text-slate-800 mt-0.5">
                              {user.phone || "Non renseigné"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Job Title */}
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="p-2 bg-purple-100 rounded-xl flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Poste / Titre
                          </p>
                          {isEditing ? (
                            <input
                              value={user.jobTitle}
                              onChange={(e) =>
                                setUser({ ...user, jobTitle: e.target.value })
                              }
                              className="mt-1 w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl py-2 px-3 text-sm font-bold outline-none"
                              placeholder="Développeur, Lead..."
                            />
                          ) : (
                            <p className="text-sm font-bold text-slate-800 mt-0.5">
                              {user.jobTitle || "Non renseigné"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Certified Member Badge */}
                  <Card className="p-6 border-none shadow-lg bg-emerald-50 text-emerald-900 border-emerald-100">
                    <h3 className="text-base font-black mb-2 flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-600" />
                      Compte vérifié
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                      Membre certifié de l'équipe depuis{" "}
                      {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {/* ── Status & Activity Tab ── */}
            {activeTab === "activity" && (
              <div className="max-w-3xl mx-auto space-y-8">
                <Card className="p-8 md:p-10 border-none shadow-xl">
                  <h3 className="text-xl font-display font-black text-slate-900 mb-6 flex items-center gap-3">
                    <Activity className="w-6 h-6 text-blue-600" />
                    Statut de présence actuel
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { id: "online", label: "En ligne", color: "bg-emerald-500" },
                      { id: "away", label: "Absent", color: "bg-amber-500" },
                      { id: "busy", label: "Occupé", color: "bg-rose-500" },
                      { id: "offline", label: "Hors ligne", color: "bg-slate-400" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setUser((prev) => ({ ...prev, status: st.id as any }))}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                          user.status === st.id
                            ? "border-blue-600 bg-blue-50/50 shadow-md"
                            : "border-slate-100 bg-slate-50 hover:bg-white"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${st.color}`} />
                        <span className="text-sm font-bold text-slate-900">{st.label}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                <Card className="p-8 md:p-10 border-none shadow-xl">
                  <h3 className="text-xl font-display font-black text-slate-900 mb-6 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-purple-600" />
                    Historique récent des activités
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { text: "Profil mis à jour", time: "Aujourd'hui" },
                      { text: "Connexion à la plateforme", time: "Hier" },
                      { text: "Participation aux tâches d'équipe", time: "Il y a 3 jours" },
                    ].map((act, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <span className="text-sm font-bold text-slate-800">{act.text}</span>
                        <span className="text-xs text-slate-500 font-medium">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === "security" && (
              <div className="max-w-2xl mx-auto py-4">
                <Card className="p-10 md:p-12 border-none shadow-2xl shadow-slate-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
                      <Shield className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-black text-slate-900">
                        Changer le mot de passe
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Protégez votre compte avec un mot de passe fort
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 rounded-2xl py-3.5 px-5 text-base font-bold outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                          Nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 rounded-2xl py-3.5 px-5 text-base font-bold outline-none"
                          placeholder="Min. 8 caractères"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                          Confirmation
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-amber-500 rounded-2xl py-3.5 px-5 text-base font-bold outline-none"
                          placeholder="Répétez le mot de passe"
                        />
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full rounded-2xl py-4 text-base font-black bg-slate-900 hover:bg-black shadow-xl"
                      onClick={handlePasswordChange}
                      loading={isLoading}
                    >
                      Mettre à jour le mot de passe
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardWrapper>
  );
}

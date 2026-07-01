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
  Bell,
  Shield,
  Layers,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DashboardWrapper from "@/components/layout/DashboardWrapper";

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
    timezone: "Africa/Douala",
    language: "fr",
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
      setUser({
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
        status: "online",
        timezone: userAny.timezone || "Africa/Douala",
        language: userAny.language || "fr",
        createdAt: userAny.createdAt ? new Date(userAny.createdAt) : new Date(),
      });
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

      // Dispatch global event so all UserAvatar components update instantly
      window.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: { name: data.user.name, image: data.user.image },
        })
      );

      // Update next-auth session
      await update({ name: data.user.name, image: data.user.image });

      // Update local state immediately so profile photo shows without refresh
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
    if (session?.user) {
      const userAny = session.user as any;
      setUser({
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
        status: "online",
        timezone: userAny.timezone || "Africa/Douala",
        language: userAny.language || "fr",
        createdAt: userAny.createdAt ? new Date(userAny.createdAt) : new Date(),
      });
    }
    setIsEditing(false);
    setAvatarPreview(null);
    setSelectedFile(null);
  };

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "security", label: "Sécurité", icon: Shield },
  ];

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  const displayAvatar = avatarPreview || user.avatar;
  const isValidAvatar =
    displayAvatar &&
    (displayAvatar.startsWith("http") ||
      displayAvatar.startsWith("data:image") ||
      displayAvatar.startsWith("/"));

  return (
    <DashboardWrapper>
      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-4">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                {isValidAvatar ? (
                  <img
                    src={displayAvatar!}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-4xl font-black select-none">
                    {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                  </span>
                )}
              </div>
              {/* Camera overlay */}
              <label
                className={`absolute inset-0 rounded-[2.5rem] flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  isEditing
                    ? "bg-black/30"
                    : "bg-transparent group-hover:bg-black/40"
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
              {/* Online dot */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            {/* Name / role */}
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
                {user.firstName}{" "}
                <span className="text-blue-600">{user.lastName}</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-black uppercase tracking-widest">
                  {user.role}
                </span>
                <span className="text-slate-400 font-bold">•</span>
                <span className="text-slate-500 font-bold">
                  {user.jobTitle || "Collaborateur"}
                </span>
              </div>
              {selectedFile && (
                <p className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Nouvelle photo — cliquez
                  Sauvegarder
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {isEditing ? (
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="rounded-2xl px-6"
                  onClick={handleCancel}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  className="rounded-2xl px-8 shadow-xl shadow-blue-500/20"
                  onClick={handleSave}
                  loading={isLoading}
                  icon={Save}
                >
                  Sauvegarder
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="rounded-2xl px-8 border-2"
                onClick={() => setIsEditing(true)}
                icon={Edit}
              >
                Modifier le profil
              </Button>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-3 bg-white/40 backdrop-blur-md p-2 rounded-3xl border border-slate-100 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black tracking-tight transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-2xl translate-y-[-2px]"
                  : "text-slate-500 hover:bg-white hover:text-slate-800"
              }`}
            >
              <tab.icon
                className={`w-5 h-5 ${
                  activeTab === tab.id ? "text-white" : "text-slate-400"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── Profile Tab ── */}
            {activeTab === "profile" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-8 space-y-8">
                  <Card className="p-10 border-none shadow-2xl shadow-slate-200">
                    <h3 className="text-2xl font-display font-black text-slate-900 mb-8 border-l-4 border-blue-600 pl-6">
                      Bio &amp; Expertise
                    </h3>
                    <div className="space-y-8">
                      <div>
                        <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                          Biographie
                        </label>
                        {isEditing ? (
                          <textarea
                            value={user.bio}
                            onChange={(e) =>
                              setUser({ ...user, bio: e.target.value })
                            }
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-3xl py-4 px-6 text-lg font-medium transition-all min-h-[150px] resize-none"
                            placeholder="Décrivez votre parcours..."
                          />
                        ) : (
                          <p className="text-xl font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-6 rounded-3xl italic">
                            {user.bio || "Aucune biographie n'a été ajoutée."}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                            Département
                          </label>
                          {isEditing ? (
                            <Input
                              value={user.department}
                              onChange={(e) =>
                                setUser({ ...user, department: e.target.value })
                              }
                              className="rounded-2xl py-4"
                            />
                          ) : (
                            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-3xl">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <Layers className="w-6 h-6 text-blue-500" />
                              </div>
                              <span className="text-lg font-black text-slate-700">
                                {user.department || "Non spécifié"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                            Localisation
                          </label>
                          <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-3xl">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                              <MapPin className="w-6 h-6 text-emerald-500" />
                            </div>
                            <span className="text-lg font-black text-slate-700">
                              {user.timezone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* ── Contact Card (LIGHT) ── */}
                <div className="lg:col-span-4 space-y-8">
                  <Card className="p-8 border-2 border-slate-100 shadow-lg bg-white">
                    <h3 className="text-xl font-display font-black text-slate-900 mb-6 flex items-center gap-3">
                      <span className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </span>
                      Contact direct
                    </h3>
                    <div className="space-y-4">
                      {/* Email */}
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="p-2 bg-blue-100 rounded-xl flex-shrink-0">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Email professionnel
                          </p>
                          <p className="text-sm font-bold text-slate-800 truncate mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="p-2 bg-emerald-100 rounded-xl flex-shrink-0">
                          <Phone className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Téléphone
                          </p>
                          {isEditing ? (
                            <input
                              value={user.phone}
                              onChange={(e) =>
                                setUser({ ...user, phone: e.target.value })
                              }
                              className="mt-1 w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl py-2 px-3 text-sm font-bold outline-none transition-all"
                              placeholder="+237 6XX XXX XXX"
                            />
                          ) : (
                            <p className="text-sm font-bold text-slate-800 mt-1">
                              {user.phone || "Non renseigné"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Job Title */}
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                        <div className="p-2 bg-purple-100 rounded-xl flex-shrink-0">
                          <Briefcase className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Poste
                          </p>
                          {isEditing ? (
                            <input
                              value={user.jobTitle}
                              onChange={(e) =>
                                setUser({ ...user, jobTitle: e.target.value })
                              }
                              className="mt-1 w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl py-2 px-3 text-sm font-bold outline-none transition-all"
                              placeholder="Ex: Développeur Full Stack"
                            />
                          ) : (
                            <p className="text-sm font-bold text-slate-800 mt-1">
                              {user.jobTitle || "Non renseigné"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Verified Badge */}
                  <Card className="p-8 border-none shadow-xl shadow-slate-100 bg-emerald-50 text-emerald-900 border-emerald-100">
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                      <Check className="w-6 h-6" />
                      Statut Vérifié
                    </h3>
                    <p className="text-emerald-700/80 font-bold leading-relaxed">
                      Membre certifié de la plateforme TeamFlow depuis{" "}
                      {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </Card>
                </div>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === "security" && (
              <div className="max-w-2xl mx-auto py-8">
                <Card className="p-12 border-none shadow-2xl shadow-slate-200">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center">
                      <Shield className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-3xl font-display font-black text-slate-900">
                      Mot de passe
                    </h3>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
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
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl py-4 px-6 text-lg font-medium transition-all outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
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
                          className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl py-4 px-6 text-lg font-medium transition-all outline-none"
                          placeholder="Min. 8 caractères"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
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
                          className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl py-4 px-6 text-lg font-medium transition-all outline-none"
                          placeholder="Répétez le mot de passe"
                        />
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full rounded-2xl py-6 text-xl font-black bg-slate-900 hover:bg-black shadow-2xl"
                      onClick={handlePasswordChange}
                      loading={isLoading}
                    >
                      Mettre à jour la sécurité
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

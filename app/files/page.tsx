"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import FileManager from "@/components/FileManager";
import { FolderOpen, Sparkles } from "lucide-react";

export default function FilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return <LoadingScreen />;
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <DashboardWrapper>
      <div className="space-y-8 pb-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold mb-2">
              <FolderOpen className="w-3.5 h-3.5" /> Explorateur de Fichiers & Dossiers
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Gestion de Documents par <span className="text-blue-600">Dossiers et Sous-Dossiers</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Classez vos fichiers, documents et médias par dossiers hiérarchiques et associez-les à vos projets.
            </p>
          </div>
        </div>

        {/* File Manager Component */}
        <FileManager />
      </div>
    </DashboardWrapper>
  );
}

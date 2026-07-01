"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  UploadCloud, 
  File, 
  Search, 
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import FileCard from "@/components/FileCard";
import { useFiles } from "@/hooks/useFiles";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/ui/LoadingScreen";
import DashboardWrapper from "@/components/layout/DashboardWrapper";
import { Card } from "@/components/ui/Card";

// ─── Main Content ─────────────────────────────────────────────────────────────
function FilesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const filters = useMemo(() => ({ 
    projectId: projectId || undefined 
  }), [projectId]);

  const { files = [], loading, refresh } = useFiles(filters);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));
    if (projectId) formData.append('projectId', projectId);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        refresh();
      } else {
         const errorText = await response.text();
         console.error('Upload failed with status', response.status, errorText);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [refresh, projectId]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const onDragEnter = (e: React.DragEvent) => setDragActive(true);
  const onDragLeave = (e: React.DragEvent) => setDragActive(false);

  const handleFileDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce fichier ?')) return;
    
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erreur réseau lors de la suppression');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Voulez-vous supprimer ces ${selectedFiles.length} fichiers ?`)) return;
    
    for (const id of selectedFiles) {
      await fetch(`/api/files/${id}`, { method: 'DELETE' });
    }
    setSelectedFiles([]);
    refresh();
  };

  const handleFileDownload = (url: string) => {
    window.open(url, '_blank');
  };

  const toggleSelect = (id: string) => {
    setSelectedFiles(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <DashboardWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-3 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">
                Mes <span className="text-blue-600">Fichiers</span>
              </h1>
              <p className="text-slate-500 mt-2 font-medium">
                {files.length} document{files.length > 1 ? 's' : ''} • Stockage sécurisé
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedFiles.length > 0 && (
              <Button variant="danger" className="rounded-2xl" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedFiles.length})
              </Button>
            )}
            <Button variant="primary" className="rounded-2xl shadow-xl shadow-blue-500/20" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5 mr-2" />
                  Uploader
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dropzone / Upload Area */}
        <Card className="p-12 border-2 border-dashed border-slate-200 bg-white/40 backdrop-blur-md rounded-[2.5rem] text-center relative group overflow-hidden hover:border-blue-400/50 transition-all">
          <div 
            className="absolute inset-0 z-0"
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
          />
          
          {dragActive && (
            <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[2px] z-10 flex items-center justify-center animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-3xl shadow-2xl scale-125 transition-transform">
                <UploadCloud className="w-12 h-12 text-blue-500 animate-bounce" />
              </div>
            </div>
          )}
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-500">
              {isUploading ? <Loader2 className="w-10 h-10 text-blue-500 animate-spin" /> : <UploadCloud className="w-10 h-10 text-blue-500" />}
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
              {isUploading ? "Upload en cours..." : "Glisser-déposer vos fichiers"}
            </h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">
              Supporte les images, PDF, documents et archives ZIP (Max 50MB)
            </p>
            <Button 
              variant="outline" 
              className="rounded-2xl border-2 px-8 py-6 h-auto text-lg font-bold"
              onClick={() => fileInputRef.current?.click()}
            >
              Parcourir les fichiers
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.zip"
            />
          </div>
        </Card>

        {/* Files Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={handleFileDelete}
              onDownload={handleFileDownload}
              selected={selectedFiles.includes(file.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>

        {files.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
              <File className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-display font-black text-slate-900">Aucun fichier</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">Commencez par uploader vos premiers documents pour les partager avec l'équipe.</p>
          </div>
        )}
      </div>
    </DashboardWrapper>
  );
}

export default function FilesPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FilesPageContent />
    </Suspense>
  );
}

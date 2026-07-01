"use client";

import { useState } from "react";
import { useFiles } from "@/hooks/useFiles";
import ContextDrawer from "./ui/ContextDrawer";
import FileCard from "./FileCard";
import { UploadCloud, File as FileIcon, Loader2 } from "lucide-react";
import { Button } from "./ui/Button";

interface ProjectFilesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export default function ProjectFilesDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ProjectFilesDrawerProps) {
  const { files, loading, refresh } = useFiles({ projectId });
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => formData.append("files", file));
    formData.append("projectId", projectId);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        refresh();
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce fichier ?")) return;
    try {
      await fetch(`/api/files/${id}`, { method: "DELETE" });
      refresh();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Fichiers - ${projectName}`}
    >
      <div className="p-6 space-y-6">
        {/* Upload Area */}
        <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
          <input
            type="file"
            multiple
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-slate-600 font-medium">Téléchargement...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
              <p className="text-sm text-slate-600 font-medium">Glisser ou cliquer pour uploader</p>
            </div>
          )}
        </div>

        {/* Files List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FileIcon className="w-4 h-4" />
            Documents récents ({files.length})
          </h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={handleDelete}
                  onDownload={(url) => window.open(url, "_blank")}
                  selected={false}
                  onToggleSelect={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-slate-50 rounded-2xl">
              <FileIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">Aucun fichier dans ce projet</p>
            </div>
          )}
        </div>
      </div>
    </ContextDrawer>
  );
}

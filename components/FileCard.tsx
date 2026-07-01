"use client";

import { motion } from "framer-motion";

import { Download, Trash2, Image as ImageIcon, FileText, Video, Archive, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

type FileType = "image" | "video" | "document" | "archive" | "other";

interface FileCardProps {
  file: {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedAt: string;
    project?: { name: string };
  };
  onDelete: (id: string) => void;
  onDownload: (url: string) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

export default function FileCard({ file, onDelete, onDownload, selected, onToggleSelect }: FileCardProps) {
  const getFileType = (): FileType => {
    const type = file.type.toLowerCase();
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.includes("pdf") || type.includes("doc")) return "document";
    if (type.includes("zip") || type.includes("rar")) return "archive";
    return "other";
  };

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case "image": return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case "video": return <Video className="w-8 h-8 text-purple-500" />;
      case "document": return <FileText className="w-8 h-8 text-red-500" />;
      case "archive": return <Archive className="w-8 h-8 text-orange-500" />;
      default: return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const previewUrl = getFileType() === "image" ? file.url : null;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`group relative bg-white rounded-2xl border-2 ${selected ? "ring-2 ring-blue-500 ring-offset-2" : "border-slate-200 hover:border-blue-300"} shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer`}
    >
      {/* Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(file.id)}
          className="w-5 h-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
        />
      </div>

      {/* Preview Image */}
      {previewUrl && (
        <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
          />
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {getFileType()}
          </div>
        </div>
      )}
      {!previewUrl && (
        <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          {getFileIcon(getFileType())}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate text-sm mb-1">
          {file.name}
        </h3>
        <p className="text-xs text-slate-500 mb-2">
          {formatSize(file.size)}
        </p>
        {file.project && (
          <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
            {file.project.name}
          </div>
        )}
        <p className="text-xs text-slate-500 mb-4">
          {new Date(file.uploadedAt).toLocaleDateString("fr-FR")}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(file.url)}
            className="flex-1"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(file.id)}
            className="p-1 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}


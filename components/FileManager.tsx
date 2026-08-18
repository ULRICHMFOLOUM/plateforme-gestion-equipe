"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, FolderPlus, FileText, Image as ImageIcon, File, Download,
  Trash2, Plus, ArrowLeft, ChevronRight, UploadCloud, Home, Search,
  CheckCircle2, FolderKanban, FolderTree, Sparkles, Loader2, X
} from "lucide-react";
import { showToast } from "./ui/Toast";

interface FolderItem {
  id: string;
  name: string;
  color?: string;
  parentFolderId?: string | null;
  projectId?: string | null;
  createdAt: string;
  _count?: { files: number; subFolders: number };
}

interface FileItem {
  id: string;
  name: string;
  url: string;
  size?: number | null;
  type?: string | null;
  uploadedAt: string;
  folderId?: string | null;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
}

interface FileManagerProps {
  projectId?: string;
  projectName?: string;
  isCompactView?: boolean;
}

export default function FileManager({ projectId, projectName, isCompactView = false }: FileManagerProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [allFolders, setAllFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [folderHistory, setFolderHistory] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [fileDisplayName, setFileDisplayName] = useState("");
  const [targetFolderId, setTargetFolderId] = useState<string>("root");
  const [isUploading, setIsUploading] = useState(false);

  // Quick inline new folder creation inside upload modal
  const [showInlineNewFolder, setShowInlineNewFolder] = useState(false);
  const [inlineFolderName, setInlineFolderName] = useState("");

  // Lightbox preview for photos and document images
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchContent();
  }, [currentFolder, projectId]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const parentIdParam = currentFolder ? currentFolder.id : "root";
      const projectParam = projectId ? `&projectId=${projectId}` : "";

      const [resFolders, resFiles, resAllFolders] = await Promise.all([
        fetch(`/api/folders?parentFolderId=${parentIdParam}${projectParam}`),
        fetch(`/api/files?folderId=${parentIdParam}${projectParam}`),
        fetch(`/api/folders?parentFolderId=all${projectParam}`),
      ]);

      if (resFolders.ok) {
        const dFolders = await resFolders.json();
        setFolders(dFolders.folders || []);
      }
      if (resFiles.ok) {
        const dFiles = await resFiles.json();
        setFiles(dFiles.files || []);
      }
      if (resAllFolders.ok) {
        const dAll = await resAllFolders.json();
        setAllFolders(dAll.folders || []);
      }
    } catch (e) {
      console.error("Error fetching files/folders:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = (folder: FolderItem) => {
    setFolderHistory((prev) => [...prev, folder]);
    setCurrentFolder(folder);
  };

  const handleNavigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setFolderHistory([]);
      setCurrentFolder(null);
    } else {
      const newHistory = folderHistory.slice(0, index + 1);
      setFolderHistory(newHistory);
      setCurrentFolder(newHistory[index]);
    }
  };

  // Trigger local file selection dialog
  const handleOpenLocalFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileObj(file);
    setFileDisplayName(file.name);
    setTargetFolderId(currentFolder ? currentFolder.id : "root");
    setShowUploadModal(true);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentFolderId: currentFolder ? currentFolder.id : null,
          projectId: projectId || null,
        }),
      });

      if (res.ok) {
        setNewFolderName("");
        setShowCreateFolderModal(false);
        fetchContent();
        showToast({ type: "success", title: "Dossier créé avec succès !" });
      }
    } catch (err) {
      console.error("Erreur création dossier:", err);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleCreateInlineFolder = async () => {
    if (!inlineFolderName.trim()) return;
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inlineFolderName.trim(),
          parentFolderId: currentFolder ? currentFolder.id : null,
          projectId: projectId || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTargetFolderId(data.folder.id);
        setInlineFolderName("");
        setShowInlineNewFolder(false);
        fetchContent();
        showToast({ type: "success", title: `Dossier "${data.folder.name}" créé !` });
      }
    } catch (e) {
      console.error("Inline folder error:", e);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileObj) return;

    setIsUploading(true);
    try {
      // Create local Object URL or Data URL automatically for instant viewing/downloading
      const generatedUrl = URL.createObjectURL(selectedFileObj);

      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fileDisplayName.trim() || selectedFileObj.name,
          url: generatedUrl,
          size: selectedFileObj.size,
          type: selectedFileObj.type || "document",
          projectId: projectId || null,
          folderId: targetFolderId === "root" ? null : targetFolderId,
        }),
      });

      if (res.ok) {
        setSelectedFileObj(null);
        setFileDisplayName("");
        setShowUploadModal(false);
        fetchContent();
        showToast({ type: "success", title: "Fichier téléversé et classé avec succès !" });
      }
    } catch (err) {
      console.error("Erreur upload:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Voulez-vous supprimer ce dossier et tout son contenu ?")) return;
    try {
      await fetch(`/api/folders?id=${folderId}`, { method: "DELETE" });
      fetchContent();
      showToast({ type: "info", title: "Dossier supprimé" });
    } catch (e) {
      console.error("Delete folder error:", e);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Supprimer ce fichier ?")) return;
    try {
      await fetch(`/api/files?id=${fileId}`, { method: "DELETE" });
      fetchContent();
      showToast({ type: "info", title: "Fichier supprimé" });
    } catch (e) {
      console.error("Delete file error:", e);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "0 Ko";
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredFiles = files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilePicked}
        className="hidden"
      />

      {/* Top Action & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher dossiers/fichiers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <FolderPlus className="w-4 h-4 text-blue-600" /> Nouveau Dossier
          </button>

          <button
            onClick={handleOpenLocalFilePicker}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <UploadCloud className="w-4 h-4" /> Téléverser un Fichier
          </button>
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/80 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => handleNavigateToBreadcrumb(-1)}
          className={`flex items-center gap-1.5 transition-colors ${currentFolder === null ? "text-blue-600 font-black" : "text-slate-500 hover:text-slate-900"}`}
        >
          <Home className="w-4 h-4" /> {projectName ? projectName : "Racine"}
        </button>

        {folderHistory.map((folder, idx) => (
          <div key={folder.id} className="flex items-center gap-2 shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => handleNavigateToBreadcrumb(idx)}
              className={`transition-colors ${idx === folderHistory.length - 1 ? "text-blue-600 font-black" : "text-slate-500 hover:text-slate-900"}`}
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-semibold">Chargement des fichiers et dossiers...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* DOSSIERS (Folders Section) */}
          {filteredFolders.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Dossiers ({filteredFolders.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFolders.map((f) => (
                  <motion.div
                    key={f.id}
                    whileHover={{ y: -3 }}
                    className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
                    onClick={() => handleOpenFolder(f)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Folder className="w-5 h-5 fill-blue-500/20 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {f._count?.subFolders || 0} sous-dossier(s) • {f._count?.files || 0} fichier(s)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(f.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* FICHIERS (Files Section) */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Fichiers ({filteredFiles.length})</h3>
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => {
                  const isImage = file.type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name || file.url);
                  const isPdf = file.type?.includes("pdf") || file.name?.endsWith(".pdf");

                  return (
                    <motion.div
                      key={file.id}
                      whileHover={{ y: -3 }}
                      className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col justify-between"
                    >
                      {/* Image or Visual Preview Header */}
                      {isImage ? (
                        <div
                          className="relative w-full h-36 bg-slate-100 overflow-hidden cursor-pointer group/img"
                          onClick={() => setPreviewFile(file)}
                        >
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              // Fallback if URL fails
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-xs font-bold text-slate-900 shadow-md">
                              👁 Aperçu photo
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gradient-to-br from-slate-50 to-indigo-50/50 flex items-center justify-center border-b border-slate-100 relative">
                          {isPdf ? (
                            <div className="flex flex-col items-center gap-1 text-red-500">
                              <FileText className="w-8 h-8" />
                              <span className="text-[10px] font-black tracking-widest bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">PDF</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-indigo-500">
                              <FileText className="w-8 h-8" />
                              <span className="text-[10px] font-black tracking-widest bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">DOC</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* File Card Body */}
                      <div className="p-3.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-bold text-slate-900 text-xs truncate cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => isImage ? setPreviewFile(file) : window.open(file.url, "_blank")}
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold">{formatFileSize(file.size)}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isImage && (
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-50 transition-colors"
                              title="Agrandir l'image"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-50 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              filteredFolders.length === 0 && (
                <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200/60 cursor-pointer hover:border-blue-300 transition-all" onClick={handleOpenLocalFilePicker}>
                  <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-bold text-slate-700 text-sm mb-1">Ce dossier est vide</p>
                  <p className="text-xs text-slate-400">Cliquez ici pour choisir et téléverser un fichier depuis votre appareil.</p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* MODAL CRÉATION DOSSIER */}
      <AnimatePresence>
        {showCreateFolderModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateFolderModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative z-10 space-y-4">
              <h3 className="font-black text-slate-900 text-lg">Nouveau Dossier</h3>
              <p className="text-xs text-slate-500">
                {currentFolder ? `Créer un sous-dossier dans "${currentFolder.name}"` : "Créer un dossier racine"}
              </p>

              <form onSubmit={handleCreateFolder} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Nom du dossier..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center gap-2 justify-end">
                  <button type="button" onClick={() => setShowCreateFolderModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
                    Annuler
                  </button>
                  <button type="submit" disabled={isCreatingFolder || !newFolderName.trim()} className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md">
                    {isCreatingFolder ? "Création..." : "Créer le dossier"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL UPLOAD FICHIER SÉLECTIONNÉ */}
      <AnimatePresence>
        {showUploadModal && selectedFileObj && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowUploadModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-lg">Classer & Téléverser</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Selected File Card Info */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                {selectedFileObj.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(selectedFileObj)}
                    alt="Aperçu"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs truncate">{selectedFileObj.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{formatFileSize(selectedFileObj.size)}</p>
                </div>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* File Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nom personnalisé du fichier</label>
                  <input
                    type="text"
                    required
                    value={fileDisplayName}
                    onChange={(e) => setFileDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Destination Folder Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Dossier de destination</label>
                    <button
                      type="button"
                      onClick={() => setShowInlineNewFolder(!showInlineNewFolder)}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <FolderPlus className="w-3.5 h-3.5" /> + Créer un dossier
                    </button>
                  </div>

                  {showInlineNewFolder ? (
                    <div className="flex items-center gap-2 my-2">
                      <input
                        type="text"
                        placeholder="Nom du nouveau dossier..."
                        value={inlineFolderName}
                        onChange={(e) => setInlineFolderName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-blue-400 rounded-xl text-xs font-bold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCreateInlineFolder}
                        className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shrink-0"
                      >
                        Créer
                      </button>
                    </div>
                  ) : null}

                  <select
                    value={targetFolderId}
                    onChange={(e) => setTargetFolderId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="root">📁 Racine (Pas de dossier)</option>
                    {allFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📂 {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
                    Annuler
                  </button>
                  <button type="submit" disabled={isUploading || !fileDisplayName.trim()} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
                    {isUploading ? "Téléversement..." : "Confirmer & Enregistrer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX PHOTO & IMAGE PREVIEW MODAL */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setPreviewFile(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <h3 className="font-bold text-sm truncate">{previewFile.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">{formatFileSize(previewFile.size)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={previewFile.url}
                    download={previewFile.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-4 h-4" /> Télécharger
                  </a>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body image container */}
              <div className="p-4 bg-slate-950/90 flex-1 flex items-center justify-center overflow-auto min-h-[300px]">
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowLeft, FolderKanban, Sparkles, Table } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ImportProjectPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [importType, setImportType] = useState<"TRELLO" | "CSV">("TRELLO");
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);

      if (file.name.endsWith(".json")) {
        setImportType("TRELLO");
        try {
          const json = JSON.parse(text);
          setProjectName(json.name || file.name.replace(".json", ""));
          if (Array.isArray(json.cards)) {
            setParsedPreview(json.cards.slice(0, 5).map((c: any) => ({
              title: c.name,
              desc: c.desc || "Pas de description",
            })));
          }
        } catch (err) {
          setError("Le fichier JSON n'est pas au format Trello valide.");
        }
      } else if (file.name.endsWith(".csv")) {
        setImportType("CSV");
        setProjectName(file.name.replace(".csv", ""));
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length > 1) {
          const headers = lines[0].split(",").map((h) => h.trim());
          const rows = lines.slice(1, 6).map((line) => {
            const values = line.split(",");
            return {
              title: values[0] || "Tâche",
              desc: values[1] || "",
            };
          });
          setParsedPreview(rows);
        }
      }
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent || !projectName) {
      setError("Veuillez saisir un nom de projet et sélectionner un fichier.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let tasksData: any[] = [];

      if (importType === "CSV" && fileContent) {
        const lines = fileContent.split("\n").filter((l) => l.trim());
        if (lines.length > 1) {
          tasksData = lines.slice(1).map((line) => {
            const parts = line.split(",");
            return {
              title: parts[0]?.trim() || "Tâche sans titre",
              description: parts[1]?.trim() || "",
              status: parts[2]?.trim() || "TODO",
              priority: parts[3]?.trim() || "MEDIUM",
            };
          });
        }
      }

      const res = await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          importType,
          fileData: fileContent,
          tasksData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'importation");

      router.push(`/projects/${data.projectId}/kanban`);
    } catch (err: any) {
      setError(err.message || "Erreur de traitement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Top back navigation */}
      <Link href="/projects" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-bold mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour aux projets
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Importer un Projet Existant</h1>
            <p className="text-slate-500 text-sm">Migrez en 1 clic vos données depuis Trello (JSON) ou Excel/Notion (CSV)</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nom du nouveau projet</label>
            <input
              type="text"
              required
              placeholder="ex: Projet Migration Teamflows"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Import type tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Format d'origine</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImportType("TRELLO")}
                className={`p-4 rounded-2xl border font-bold text-sm flex items-center gap-3 transition-all ${
                  importType === "TRELLO" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <FolderKanban className="w-5 h-5 text-blue-600" /> Export Trello (.json)
              </button>
              <button
                type="button"
                onClick={() => setImportType("CSV")}
                className={`p-4 rounded-2xl border font-bold text-sm flex items-center gap-3 transition-all ${
                  importType === "CSV" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <Table className="w-5 h-5 text-emerald-600" /> Fichier CSV (.csv / Excel)
              </button>
            </div>
          </div>

          {/* File Upload Box */}
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 rounded-3xl p-8 text-center transition-all cursor-pointer relative">
            <input
              type="file"
              accept={importType === "TRELLO" ? ".json" : ".csv"}
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-sm">
              {fileName ? fileName : "Cliquez ou glissez-déposez votre fichier ici"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {importType === "TRELLO" ? "Exporter votre tableau Trello sous Format JSON (Menu Trello > Plus > Imprimer et exporter)" : "Format CSV : Titre, Description, Statut, Priorité"}
            </p>
          </div>

          {/* Preview section */}
          {parsedPreview.length > 0 && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Aperçu des cartes détectées ({parsedPreview.length}+)</p>
              <div className="space-y-2">
                {parsedPreview.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>{item.title}</span>
                    <span className="text-slate-400 font-normal truncate max-w-[200px]">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !fileContent}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? "Importation en cours..." : "Lancer l'importation du projet"} <Sparkles className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

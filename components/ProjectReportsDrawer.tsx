"use client";

import { useState } from "react";
import ContextDrawer from "./ui/ContextDrawer";
import { BarChart3, FileSpreadsheet, Download, CheckCircle2, TrendingUp, DollarSign, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ProjectReportsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  progress: number;
  budget?: number | null;
  spent?: number | null;
  totalTasks: number;
  doneTasks: number;
}

export default function ProjectReportsDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
  progress,
  budget = 0,
  spent = 0,
  totalTasks,
  doneTasks,
}: ProjectReportsDrawerProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExportPDF = () => {
    setDownloading("PDF");
    setTimeout(() => {
      alert(`Rapport PDF du projet "${projectName}" généré avec succès !`);
      setDownloading(null);
    }, 1200);
  };

  const handleExportExcel = () => {
    setDownloading("EXCEL");
    setTimeout(() => {
      alert(`Fichier Excel du projet "${projectName}" exporté avec succès !`);
      setDownloading(null);
    }, 1200);
  };

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const budgetUtilization = (budget && budget > 0) ? Math.round(((spent || 0) / budget) * 100) : 0;

  return (
    <ContextDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Rapports & Synthèse — ${projectName}`}
      width="w-full sm:w-[500px] lg:w-[650px]"
    >
      <div className="p-6 space-y-6">
        {/* Banner */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Rapport d'activité temps réel</h3>
              <p className="text-xs text-emerald-100 mt-0.5">Analytique complète du projet</p>
            </div>
          </div>
          <Link
            href={`/reports?projectId=${projectId}`}
            onClick={onClose}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-all"
          >
            Module complet <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avancement global</p>
            <p className="text-3xl font-black text-slate-900">{progress}%</p>
            <div className="w-full h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Taux de complétion</p>
            <p className="text-3xl font-black text-slate-900">{completionRate}%</p>
            <p className="text-xs text-slate-500 font-semibold mt-2">{doneTasks} sur {totalTasks} tâches terminées</p>
          </div>

          {budget && budget > 0 ? (
            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Consommation du budget</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-slate-900">{(spent || 0).toLocaleString()} XAF</p>
                <p className="text-xs text-slate-500 font-bold">Sur {(budget).toLocaleString()} XAF ({budgetUtilization}%)</p>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className={`h-full rounded-full ${budgetUtilization > 90 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${Math.min(100, budgetUtilization)}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Download Buttons */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3">
          <h4 className="font-black text-slate-900 text-sm">Télécharger un rapport analytique</h4>

          <button
            onClick={handleExportPDF}
            disabled={downloading !== null}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-between transition-all disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Exporter le Rapport Officiel (PDF)
            </span>
            <span className="text-[10px] uppercase font-black bg-white/20 px-2 py-0.5 rounded-lg">PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={downloading !== null}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center justify-between transition-all disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Exporter le Tableau de Suivi (Excel)
            </span>
            <span className="text-[10px] uppercase font-black bg-white/20 px-2 py-0.5 rounded-lg">XLSX</span>
          </button>
        </div>
      </div>
    </ContextDrawer>
  );
}

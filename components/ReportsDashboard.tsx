"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import { motion } from "framer-motion";
import {
  TrendingUp, CheckCircle2, Clock, AlertTriangle,
  FolderOpen, Target, Activity, BarChart3, Loader2,
} from "lucide-react";

interface Stats {
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
    completionRate: number;
  };
  tasksByPriority: { name: string; value: number; color: string }[];
  tasksByStatus: { name: string; value: number; fill: string }[];
  projectProgress: { name: string; progress: number; status: string }[];
  dailyActivity: { date: string; créées: number; terminées: number }[];
  projectCount: number;
}

const RADIAN = Math.PI / 180;

// Custom label for pie chart
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      className="text-xs font-black" style={{ fontSize: 11, fontWeight: 900 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Tooltip custom
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-3 text-xs">
      {label && <p className="font-black text-slate-600 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-bold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// Stat Card mini
function MiniStatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all"
    >
      <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function ReportsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!stats) return null;

  const { taskStats, tasksByPriority, tasksByStatus, projectProgress, dailyActivity, projectCount } = stats;

  // Radial gauge data for completion rate
  const gaugeData = [{ name: "Taux", value: taskStats.completionRate, fill: "#3b82f6" }];

  return (
    <div className="space-y-8">
      {/* ─── KPI Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStatCard icon={Target} label="Taux de complétion" value={`${taskStats.completionRate}%`} sub={`${taskStats.done}/${taskStats.total} tâches`} color="bg-blue-500" />
        <MiniStatCard icon={CheckCircle2} label="Tâches terminées" value={taskStats.done} sub="au total" color="bg-emerald-500" />
        <MiniStatCard icon={Clock} label="En cours" value={taskStats.inProgress} sub="actuellement" color="bg-indigo-500" />
        <MiniStatCard icon={AlertTriangle} label="En retard" value={taskStats.overdue} sub="nécessite attention" color={taskStats.overdue > 0 ? "bg-red-500" : "bg-slate-400"} />
      </div>

      {/* ─── Charts Row 1 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart — Priority */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <Target className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">Tâches par priorité</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={tasksByPriority}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {tasksByPriority.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {tasksByPriority.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-slate-500">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bar Chart — Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">Tâches par statut</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tasksByStatus} barSize={32} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {tasksByStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Completion Rate Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">Progression globale</h3>
          </div>
          <div className="relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart
                cx="50%" cy="60%"
                innerRadius="60%" outerRadius="90%"
                startAngle={210} endAngle={-30}
                data={gaugeData}
              >
                <RadialBar
                  background={{ fill: "#f1f5f9" }}
                  dataKey="value"
                  cornerRadius={10}
                  max={100}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute bottom-6 text-center">
              <p className="text-4xl font-black text-slate-900">{taskStats.completionRate}%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">complété</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-slate-50 rounded-2xl">
              <p className="text-lg font-black text-slate-900">{projectCount}</p>
              <p className="text-[10px] font-bold text-slate-500">Projets</p>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-2xl">
              <p className="text-lg font-black text-slate-900">{taskStats.total}</p>
              <p className="text-[10px] font-bold text-slate-500">Tâches</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Charts Row 2 ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart — Daily Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Activity className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">Activité — 7 derniers jours</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
              <Line type="monotone" dataKey="créées" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="terminées" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Horizontal Bar — Project Progress */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-green-500" />
            </div>
            <h3 className="font-black text-slate-900 text-sm">Progression des projets</h3>
          </div>
          {projectProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm text-slate-400 font-medium">Aucun projet disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectProgress.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-700 truncate max-w-[60%]">{p.name}</span>
                    <span className="text-xs font-black text-slate-900">{p.progress}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      className={`h-full rounded-full ${
                        p.progress >= 80 ? "bg-emerald-500" :
                        p.progress >= 50 ? "bg-blue-500" :
                        p.progress >= 25 ? "bg-amber-500" : "bg-red-400"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

"use client";
/**
 * Admin Dashboard Visualizations with Recharts
 */

import React from "react";
import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

// Sample / Real data structures
const taskTrendData = [
  { day: "Lun", créées: 12, terminées: 8 },
  { day: "Mar", créées: 18, terminées: 14 },
  { day: "Mer", créées: 15, terminées: 19 },
  { day: "Jeu", créées: 24, terminées: 20 },
  { day: "Ven", créées: 30, terminées: 27 },
  { day: "Sam", créées: 8, terminées: 10 },
  { day: "Dim", créées: 5, terminées: 6 },
];

const statusPieData = [
  { name: "À faire", value: 35, color: "#94a3b8" },
  { name: "En cours", value: 45, color: "#3b82f6" },
  { name: "Terminées", value: 68, color: "#10b981" },
];

const workloadBarData = [
  { name: "Alexandre", tâches: 12 },
  { name: "Mariam", tâches: 16 },
  { name: "Jean-Paul", tâches: 8 },
  { name: "Sophie", tâches: 14 },
  { name: "David", tâches: 9 },
];

const featureAdoptionData = [
  { feature: "Chat & Groupes", taux: 92 },
  { feature: "Visio HD", taux: 78 },
  { feature: "Tâches & Kanban", taux: 88 },
  { feature: "Fichiers Cloud", taux: 64 },
  { feature: "Calendrier", taux: 71 },
];

export function TasksTrendChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={taskTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", borderRadius: "16px", border: "none", color: "#fff" }}
          />
          <Area type="monotone" dataKey="créées" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCreated)" />
          <Area type="monotone" dataKey="terminées" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDone)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart() {
  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={statusPieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {statusPieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff" }} />
          <Legend formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WorkloadBarChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={workloadBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff" }} />
          <Bar dataKey="tâches" fill="#6366f1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FeatureAdoptionChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={featureAdoptionData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
          <XAxis type="number" domain={[0, 100]} unit="%" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis dataKey="feature" type="category" axisLine={false} tickLine={false} tick={{ fill: "#334155", fontSize: 11, fontWeight: 700 }} />
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff" }} />
          <Bar dataKey="taux" fill="#3b82f6" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

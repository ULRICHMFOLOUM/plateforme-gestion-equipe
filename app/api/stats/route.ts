import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Tâches de l'utilisateur
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { assigneeId: session.user.id },
        ],
      },
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        dueDate: true,
      },
    });

    // Projets de l'utilisateur
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        budget: true,
        spent: true,
        color: true,
      },
    });

    // ─── Stats de base ───
    const taskStats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      overdue: tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
      ).length,
      completionRate:
        tasks.length > 0
          ? Math.round((tasks.filter((t) => t.status === "DONE").length / tasks.length) * 100)
          : 0,
    };

    // ─── Tâches par priorité (pour donut chart) ───
    const tasksByPriority = [
      { name: "Haute", value: tasks.filter((t) => t.priority === "HIGH").length, color: "#ef4444" },
      { name: "Moyenne", value: tasks.filter((t) => t.priority === "MEDIUM").length, color: "#f59e0b" },
      { name: "Basse", value: tasks.filter((t) => t.priority === "LOW").length, color: "#10b981" },
    ];

    // ─── Tâches par statut (pour bar chart) ───
    const tasksByStatus = [
      { name: "À faire", value: taskStats.todo, fill: "#94a3b8" },
      { name: "En cours", value: taskStats.inProgress, fill: "#3b82f6" },
      { name: "Terminé", value: taskStats.done, fill: "#10b981" },
      { name: "En retard", value: taskStats.overdue, fill: "#ef4444" },
    ];

    // ─── Progression des projets (pour horizontal bar) ───
    const projectProgress = projects
      .slice(0, 6)
      .map((p) => ({
        name: p.name.length > 16 ? p.name.substring(0, 14) + "…" : p.name,
        progress: p.progress || 0,
        status: p.status,
      }));

    // ─── Tâches créées par jour (30 derniers jours) pour line chart ───
    const dailyActivity: { date: string; créées: number; terminées: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStr = day.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));

      dailyActivity.push({
        date: dayStr,
        créées: tasks.filter((t) => t.createdAt >= dayStart && t.createdAt <= dayEnd).length,
        terminées: tasks.filter(
          (t) => t.status === "DONE" && t.createdAt >= dayStart && t.createdAt <= dayEnd
        ).length,
      });
    }

    return NextResponse.json({
      taskStats,
      tasksByPriority,
      tasksByStatus,
      projectProgress,
      dailyActivity,
      projectCount: projects.length,
    });
  } catch (error) {
    console.error("Erreur statistiques:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

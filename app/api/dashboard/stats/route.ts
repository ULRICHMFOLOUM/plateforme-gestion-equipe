import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const userId = session.user.id;

    // Projects with members and task counts
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        budget: true,
        spent: true,
        tasks: { select: { status: true } },
        members: {
          take: 4,
          select: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        owner: { select: { id: true, name: true, image: true } },
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const totalProjects = projects.length;
    let totalProgress = 0, totalBudget = 0, totalSpent = 0, totalTasks = 0, completedTasks = 0;

    projects.forEach((p) => {
      totalProgress += p.progress || 0;
      totalBudget += p.budget || 0;
      totalSpent += p.spent || 0;
      totalTasks += p.tasks.length;
      completedTasks += p.tasks.filter((t) => t.status === "DONE").length;
    });

    const avgProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Upcoming events
    const upcomingEvents = await prisma.event.findMany({
      where: {
        OR: [{ userId }, { Project: { members: { some: { userId } } } }],
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    });

    // Urgent tasks
    const urgentTasks = await prisma.task.findMany({
      where: { assigneeId: userId, status: { not: "DONE" }, priority: "HIGH" },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // Weekly chart — completed tasks per day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentDone = await prisma.task.findMany({
      where: { assigneeId: userId, status: "DONE", updatedAt: { gte: sevenDaysAgo } },
      select: { updatedAt: true },
    });

    const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      return {
        day: dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1],
        tasks: recentDone.filter((t) => { const u = new Date(t.updatedAt); return u >= d && u <= end; }).length,
        date: d.toISOString().split("T")[0],
      };
    });

    // Serialised project list for dashboard cards
    const projectCards = projects.slice(0, 6).map((p) => {
      const allMembers = [
        p.owner,
        ...p.members.map((m) => m.user).filter((u) => u.id !== p.owner.id),
      ].slice(0, 5);
      const done = p.tasks.filter((t) => t.status === "DONE").length;
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        progress: p.progress || 0,
        taskCount: p.tasks.length,
        doneCount: done,
        members: allMembers,
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      summary: {
        projects: totalProjects,
        avgProgress,
        taskCompletionRate,
        budget: {
          total: totalBudget,
          spent: totalSpent,
          utilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
        },
      },
      projectCards,
      upcomingEvents,
      urgentTasks,
      weeklyActivity,
    });
  } catch (error) {
    console.error("Erreur stats dashboard:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

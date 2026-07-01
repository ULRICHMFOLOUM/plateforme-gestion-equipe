import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer tous les projets de l'utilisateur (proprio ou membre)
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } },
        ],
      },
      select: {
        id: true,
        progress: true,
        budget: true,
        spent: true,
        tasks: {
          select: { status: true }
        }
      }
    });

    const totalProjects = projects.length;
    let totalProgress = 0;
    let totalBudget = 0;
    let totalSpent = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    projects.forEach(p => {
      totalProgress += p.progress || 0;
      totalBudget += p.budget || 0;
      totalSpent += p.spent || 0;
      totalTasks += p.tasks.length;
      completedTasks += p.tasks.filter(t => t.status === 'DONE').length;
    });

    const avgProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Prochains événements
    const upcomingEvents = await prisma.event.findMany({
      where: {
        OR: [
          { userId: userId },
          {
            Project: {
              members: { some: { userId: userId } }
            }
          }
        ],
        startDate: { gte: new Date() }
      },
      orderBy: { startDate: 'asc' },
      take: 5
    });

    // Tâches récentes/urgentes
    const urgentTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: 'DONE' },
        priority: 'HIGH'
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    return NextResponse.json({
      summary: {
        projects: totalProjects,
        avgProgress,
        taskCompletionRate,
        budget: {
          total: totalBudget,
          spent: totalSpent,
          utilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
        }
      },
      upcomingEvents,
      urgentTasks
    });
  } catch (error) {
    console.error("Erreur stats dashboard:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

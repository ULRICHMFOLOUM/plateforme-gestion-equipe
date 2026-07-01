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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: any = {
      userId: session.user.id,
    };

    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        Project: {
          select: { name: true }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Erreur lors de la récupération des rapports:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { title, type, projectId, content: extraNotes } = await request.json();

    if (!title || !type) {
      return NextResponse.json(
        { error: "Titre et type requis" },
        { status: 400 }
      );
    }

    let reportContent = "";

    // Si un projet est sélectionné, on agrège des données réelles
    if (projectId && projectId !== "all") {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          members: {
            include: {
              user: {
                select: { name: true, email: true, role: true }
              }
            }
          },
          activityLogs: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } } }
          }
        }
      });

      if (project) {
        const stats = {
          totalTasks: project.tasks.length,
          todoTasks: project.tasks.filter(t => t.status === 'TODO').length,
          inProgressTasks: project.tasks.filter(t => t.status === 'IN_PROGRESS').length,
          doneTasks: project.tasks.filter(t => t.status === 'DONE').length,
          progress: project.progress,
          budget: project.budget,
          spent: project.spent,
          status: project.status,
          priority: project.priority,
          membersCount: project.members.length,
          members: project.members.map(m => ({
            name: m.user.name || m.user.email,
            role: m.role
          })),
          recentActivity: project.activityLogs.map(log => ({
            action: log.action,
            user: log.user.name,
            at: log.createdAt
          }))
        };

        reportContent = JSON.stringify({
          notes: extraNotes,
          projectStats: stats,
          generatedAt: new Date().toISOString()
        });
      }
    } else {
      reportContent = JSON.stringify({
        notes: extraNotes || "Rapport général sur l'ensemble des activités.",
        generatedAt: new Date().toISOString()
      });
    }

    const report = await prisma.report.create({
      data: {
        title,
        type,
        content: reportContent,
        userId: session.user.id,
        projectId: (projectId && projectId !== "all") ? projectId : undefined,
      },
      include: {
        Project: {
          select: { name: true }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Erreur création rapport:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

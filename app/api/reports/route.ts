import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["PROGRESS", "PERFORMANCE", "FINANCIAL", "TASKS", "TEAM", "FULL", "ACTIVITY", "BUDGET"];

const TYPE_MAP: Record<string, string> = {
  PROGRESS: "PROGRESS",
  WORKLOAD: "TEAM",
  ACTIVITY: "ACTIVITY",
  FINANCIAL: "FINANCIAL",
  TASKS: "TASKS",
  PERFORMANCE: "PERFORMANCE",
  BUDGET: "BUDGET",
  FULL: "FULL",
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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

    const transformed = reports.map(r => ({
      ...r,
      project: r.Project ? { name: r.Project.name } : undefined,
    }));

    return NextResponse.json(transformed);
  } catch (error: any) {
    console.error("Erreur lors de la récupération des rapports:", error?.message || error);
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

    const body = await request.json();
    const { title, type: rawType, projectId, content: extraNotes } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Le titre est requis" },
        { status: 400 }
      );
    }

    const reportType = TYPE_MAP[rawType] || (VALID_TYPES.includes(rawType) ? rawType : "PROGRESS");
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
                select: { name: true, email: true }
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
          projectName: project.name,
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
            action: log.details || log.action,
            user: log.user?.name || "Utilisateur",
            at: log.createdAt
          }))
        };

        reportContent = JSON.stringify({
          notes: extraNotes || "",
          projectStats: stats,
          generatedAt: new Date().toISOString()
        });
      } else {
        reportContent = JSON.stringify({
          notes: extraNotes || "Rapport de projet.",
          generatedAt: new Date().toISOString()
        });
      }
    } else {
      reportContent = JSON.stringify({
        notes: extraNotes || "Rapport général sur l'ensemble des activités de l'équipe.",
        generatedAt: new Date().toISOString()
      });
    }

    const reportData: any = {
      title,
      type: reportType,
      content: reportContent,
      userId: session.user.id,
    };

    if (projectId && projectId !== "all") {
      reportData.projectId = projectId;
    }

    const report = await prisma.report.create({
      data: reportData,
      include: {
        Project: {
          select: { name: true }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    });

    const transformedReport = {
      ...report,
      project: report.Project ? { name: report.Project.name } : undefined,
    };

    return NextResponse.json(transformedReport, { status: 201 });
  } catch (error: any) {
    console.error("Erreur création rapport:", error?.message || error);
    return NextResponse.json(
      { error: "Erreur lors de la création du rapport: " + (error?.message || "Erreur interne") },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const projectId = params.id;

    // Fetch project data and stats separately for stability
    const [project, taskCount, memberCount, fileCount] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          owner: { select: { name: true, email: true } },
          members: { include: { user: { select: { name: true, email: true } } } },
          tasks: { include: { assignee: { select: { name: true, email: true } } } },
        }
      }),
      prisma.task.count({ where: { projectId } }),
      prisma.groupMember.count({ where: { projectId } }),
      prisma.file.count({ where: { projectId } }),
    ]);

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const isOwner = project.ownerId === session.user.id;
    const isMember = project.members.some(m => m.userId === session.user.id);

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Calculate statistics
    const tasksDone = project.tasks.filter(t => t.status === "DONE").length;
    const tasksInProgress = project.tasks.filter(t => t.status === "IN_PROGRESS").length;
    const tasksTodo = project.tasks.filter(t => t.status === "TODO").length;

    const reportData = {
      projectInfo: {
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress,
        startDate: project.startDate,
        endDate: project.endDate,
        owner: project.owner.name || project.owner.email,
      },
      stats: {
        totalTasks: taskCount,
        completedTasks: tasksDone,
        pendingTasks: tasksInProgress + tasksTodo,
        totalMembers: memberCount,
        totalFiles: fileCount,
        budget: project.budget,
        spent: project.spent,
      },
      members: project.members.map(m => ({
        name: m.user.name || m.user.email,
        role: m.role,
      })),
      recentTasks: project.tasks.slice(0, 5).map(t => ({
        title: t.title,
        status: t.status,
        assignee: t.assignee ? (t.assignee.name || t.assignee.email) : "Non assigné",
      })),
      generatedAt: new Date(),
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Erreur génération rapport:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

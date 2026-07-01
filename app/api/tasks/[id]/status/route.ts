import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string; // Task ID
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Le statut est requis" },
        { status: 400 }
      );
    }

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            members: true,
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    const hasAccess = 
      task.userId === session.user.id || 
      task.assigneeId === session.user.id ||
      (task.project && (
        task.project.ownerId === session.user.id ||
        task.project.members.some(m => m.userId === session.user.id)
      ));

    if (!hasAccess) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        status: status,
      },
    });

    // Create activity log
    if (updatedTask.projectId) {
      await prisma.activityLog.create({
        data: {
          action: "TASK_UPDATED",
          details: `Statut de la tâche "${updatedTask.title}" changé en ${status}`,
          type: "TASK",
          projectId: updatedTask.projectId,
          userId: session.user.id,
        }
      });

      const allTasks = await prisma.task.findMany({
        where: { projectId: updatedTask.projectId }
      });
      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(t => t.status === "DONE").length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      await prisma.project.update({
        where: { id: updatedTask.projectId },
        data: { progress }
      });

      // Notification logic for completion
      if (status === "DONE" && task.project && task.project.ownerId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: task.project.ownerId,
            type: "TASK_COMPLETED",
            title: "Tâche terminée",
            message: `${session.user.name || session.user.email} a terminé la tâche "${updatedTask.title}"`,
            data: JSON.stringify({ taskId: updatedTask.id, projectId: updatedTask.projectId }),
          }
        });
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la tâche:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

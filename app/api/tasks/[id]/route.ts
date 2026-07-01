import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          { assigneeId: session.user.id },
          { project: { members: { some: { userId: session.user.id } } } },
        ],
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        project: {
          select: { id: true, name: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        files: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Erreur lors de la récupération de la tâche:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assigneeId,
    } = body;

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { userId: true, projectId: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    // Vérifier si l'utilisateur a accès à cette tâche (propriétaire ou membre du projet)
    let hasAccess = task.userId === session.user.id;

    if (task.projectId) {
      const projectMember = await prisma.groupMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: session.user.id,
        },
      });
      hasAccess = hasAccess || !!projectMember;
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Mise à jour de la tâche sans transaction interactive
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });

    // Opérations secondaires (notifications et logs)
    try {
      // 1. Notification si le statut a changé
      // Note: On pourrait comparer avec l'ancien état si nécessaire, 
      // mais ici on simplifie pour la stabilité.
      if (status) {
        const recipients = new Set<string>();
        if (updatedTask.userId !== session.user.id) recipients.add(updatedTask.userId);
        if (updatedTask.project?.ownerId && updatedTask.project.ownerId !== session.user.id)
          recipients.add(updatedTask.project.ownerId);

        const recipientIds = Array.from(recipients);
        for (const recipientId of recipientIds) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              type: "TASK_COMPLETED", 
              title: "Mise à jour de tâche",
              message: `Le statut de la tâche "${updatedTask.title}" est passé à ${status.toLowerCase()}.`,
              data: JSON.stringify({
                taskId: updatedTask.id,
                projectId: updatedTask.projectId,
                newStatus: status,
              }),
            },
          });
        }
      }

      // 2. Activity Log (Uniquement si projectId est valide)
      if (updatedTask.projectId) {
        await prisma.activityLog.create({
          data: {
            action: "TASK_UPDATED",
            type: "TASK",
            details: `Tâche "${updatedTask.title}" mise à jour (Statut: ${status}).`,
            userId: session.user.id,
            projectId: updatedTask.projectId,
          },
        });
      }
    } catch (secondaryError) {
      console.error("Erreur lors des logs/notifications de mise à jour:", secondaryError);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, dueDate, assigneeId } = body;

    // Check access
    const existing = await prisma.task.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          { assigneeId: session.user.id },
          { project: { members: { some: { userId: session.user.id } } } },
        ],
      },
      select: { id: true, title: true, userId: true, projectId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tâche non trouvée ou accès refusé" }, { status: 404 });
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, image: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur PATCH tâche:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que la tâche appartient à l'utilisateur
    const existingTask = await prisma.task.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Tâche non trouvée" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Tâche supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la tâche:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const where: any = {
      OR: [
        { userId: session.user.id },
        {
          project: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      ],
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches:", error);
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
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assigneeId,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Le titre est requis" },
        { status: 400 }
      );
    }

    // Création de la tâche sans transaction interactive pour plus de stabilité
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: session.user.id,
        projectId: projectId || null,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Opérations secondaires en tâche de fond (non bloquantes pour la création)
    try {
      // 1. Notification si la tâche est assignée à quelqu'un d'autre
      if (assigneeId && assigneeId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: assigneeId,
            type: "TASK_ASSIGNED",
            title: "Nouvelle tâche assignée",
            message: `Vous avez été assigné à la tâche "${title}"${
              newTask.project ? ` dans le projet "${newTask.project.name}"` : ""
            }.`,
            data: JSON.stringify({ taskId: newTask.id, projectId }),
          },
        });
      }

      // 2. Log d'activité (Uniquement si lié à un projet carProjectId est requis dans le schéma ActivityLog)
      if (projectId) {
        await prisma.activityLog.create({
          data: {
            action: "TASK_CREATED",
            type: "TASK",
            details: `Tâche "${title}" créée${
              assigneeId ? ` et assignée à un membre` : ""
            }.`,
            userId: session.user.id,
            projectId: projectId, 
          },
        });
      }
    } catch ( secondaryError ) {
      console.error("Erreur lors des opérations secondaires (log/notif):", secondaryError);
      // On ne fait pas planter la création de la tâche si le log échoue
    }

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la tâche:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

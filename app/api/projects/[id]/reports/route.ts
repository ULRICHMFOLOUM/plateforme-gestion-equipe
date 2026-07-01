import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const projectId = params.id;

    // Vérifier accès au projet
    const projectAccess = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (!projectAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Stats projet
    const [project, taskStats, memberStats, fileCount, commentCount] =
      await Promise.all([
        prisma.project.findUnique({
          where: { id: projectId },
          include: { owner: true },
        }),
        prisma.task.groupBy({
          by: ["status"],
          _count: { id: true },
          where: { projectId },
        }),
        prisma.groupMember.count({
          where: { projectId },
        }),
        prisma.file.count({ where: { projectId } }),
        prisma.comment.count({ where: { projectId } }),
      ]);

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Calcul progression si pas définie
    const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const doneTasks =
      taskStats.find((stat) => stat.status === "DONE")?._count.id || 0;
    const calculatedProgress =
      totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const report = {
      projectId: project.id,
      projectName: project.name,
      owner: project.owner.name || project.owner.email,
      stats: {
        tasks: {
          total: totalTasks,
          todo: taskStats.find((s) => s.status === "TODO")?._count.id || 0,
          inProgress:
            taskStats.find((s) => s.status === "IN_PROGRESS")?._count.id || 0,
          done: doneTasks,
          progress: calculatedProgress,
        },
        members: memberStats,
        files: fileCount,
        comments: commentCount,
        budget: {
          total: project.budget || 0,
          spent: project.spent || 0,
          remaining: (project.budget || 0) - (project.spent || 0),
          utilization: project.budget
            ? Math.round(((project.spent || 0) / project.budget) * 100)
            : 0,
        },
        status: project.status,
        dates: {
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("Erreur rapports projet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const projectId = params.id;
    const { type = "full" } = await request.json();

    // Vérifier accès (comme GET)
    const projectAccess = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });

    if (!projectAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récup stats (comme GET)
    const statsResponse = await fetch(
      `${request.nextUrl.origin}/api/projects/${projectId}/reports`,
    );
    const stats = await statsResponse.json();

    // Générer contenu rapport
    let title = "";
    let content = "";

    switch (type) {
      case "tasks":
        title = `Rapport Tâches - ${projectAccess.name}`;
        content = `
RAPPORT DES TÂCHES - ${projectAccess.name}

Statistiques :
• Total tâches : ${stats.stats.tasks.total}
• À faire : ${stats.stats.tasks.todo}
• En cours : ${stats.stats.tasks.inProgress}
• Terminées : ${stats.stats.tasks.done}
• Progression : ${stats.stats.tasks.progress}%

Tâches urgentes : Vérifiez les priorités élevées.
Recommandation : Assignez les tâches en attente.
        `;
        break;
      case "team":
        title = `Rapport Équipe - ${projectAccess.name}`;
        content = `
RAPPORT ÉQUIPE - ${projectAccess.name}

Effectif : ${stats.stats.members} membres
Activité : ${stats.stats.comments} commentaires
Fichiers partagés : ${stats.stats.files}

Recommandations :
• Équilibrer la charge de travail
• Organiser réunion d'équipe hebdomadaire
        `;
        break;
      case "budget":
        title = `Rapport Budget - ${projectAccess.name}`;
        content = `
RAPPORT BUDGÉTAIRE - ${projectAccess.name}

Budget total : ${stats.stats.budget.total}€
Dépensé : ${stats.stats.budget.spent}€
Restant : ${stats.stats.budget.remaining}€
Utilisation : ${stats.stats.budget.utilization}%

Alerte si > 80% utilisation.
        `;
        break;
      default:
        title = `Rapport Complet - ${projectAccess.name} (${new Date().toLocaleDateString("fr-FR")})`;
        content = `RAPPORT COMPLET PROJET

${projectAccess.name}
Propriétaire : ${stats.projectName}

📊 STATISTIQUES :
Tâches : ${stats.stats.tasks.total} (${stats.stats.tasks.progress}%)
Équipe : ${stats.stats.members} membres
Fichiers : ${stats.stats.files}
Commentaires : ${stats.stats.comments}

💰 BUDGET :
Total : ${stats.stats.budget.total}€
Utilisation : ${stats.stats.budget.utilization}%

📅 PLANNING :
Créé : ${new Date(stats.stats.dates.createdAt).toLocaleDateString("fr-FR")}
Status : ${stats.stats.status}

Généré le ${new Date(stats.generatedAt).toLocaleDateString("fr-FR")}
        `;
    }

    // 1. Créer le rapport (Opération principale)
    const report = await prisma.report.create({
      data: {
        title,
        content,
        type: (type.toUpperCase() === "TASKS" || type.toUpperCase() === "TEAM" || type.toUpperCase() === "FULL" || type.toUpperCase() === "PROGRESS" || type.toUpperCase() === "BUDGET") 
          ? type.toUpperCase() as any 
          : "ACTIVITY",
        userId: session.user.id,
        projectId: projectId,
      },
    });

    // Opérations secondaires (notifications)
    try {
      // 2. Récupérer le propriétaire et les membres du projet
      const projectWithMembers = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { select: { userId: true } } }
      });

      const recipients = new Set<string>();
      if (projectWithMembers?.ownerId && projectWithMembers.ownerId !== session.user.id)
        recipients.add(projectWithMembers.ownerId);
      
      projectWithMembers?.members.forEach(m => {
        if (m.userId !== session.user.id) recipients.add(m.userId);
      });

      const recipientIds = Array.from(recipients);
      
      // 3. Notifier l'équipe séquentiellement
      for (const recipientId of recipientIds) {
        await prisma.notification.create({
          data: {
            userId: recipientId,
            type: "GENERAL",
            title: "Nouveau rapport disponible",
            message: `Un nouveau rapport "${title}" a été généré pour le projet "${projectAccess.name}".`,
            data: JSON.stringify({ reportId: report.id, projectId }),
          },
        });
      }
    } catch (secondaryError) {
      console.error("Erreur lors des notifications du rapport:", secondaryError);
    }

    return NextResponse.json({
      reportId: report.id,
      downloadUrl: `/api/projects/${projectId}/reports/${report.id}/export?type=${type}`,
      stats,
    });
  } catch (error) {
    console.error("Erreur génération rapport:", error);
    return NextResponse.json({ error: "Erreur génération" }, { status: 500 });
  }
}

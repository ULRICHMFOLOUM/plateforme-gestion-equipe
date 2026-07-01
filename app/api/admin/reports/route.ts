import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const reports = await prisma.report.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { type } = await request.json();

    if (!type || !["ACTIVITY", "PERFORMANCE", "FINANCIAL"].includes(type)) {
      return NextResponse.json(
        { error: "Type de rapport invalide" },
        { status: 400 }
      );
    }

    // Générer le contenu du rapport selon le type
    let title = "";
    let content = "";

    switch (type) {
      case "ACTIVITY":
        title =
          "Rapport d'activité - " + new Date().toLocaleDateString("fr-FR");
        content = await generateActivityReport();
        break;
      case "PERFORMANCE":
        title =
          "Rapport de performance - " + new Date().toLocaleDateString("fr-FR");
        content = await generatePerformanceReport();
        break;
      case "FINANCIAL":
        title = "Rapport financier - " + new Date().toLocaleDateString("fr-FR");
        content = await generateFinancialReport();
        break;
    }

    const report = await prisma.report.create({
      data: {
        title,
        content,
        type: type as "ACTIVITY" | "PERFORMANCE" | "FINANCIAL",
        userId: session.user.id,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Erreur lors de la création du rapport:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

async function generateActivityReport(): Promise<string> {
  const [
    totalUsers,
    activeUsers,
    totalProjects,
    totalTasks,
    totalFiles,
    totalEvents,
    recentTasks,
    recentEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count(), // Fallback sans isActive
    prisma.project.count(),
    prisma.task.count(),
    prisma.file.count(),
    prisma.event.count(),
    prisma.task.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
        },
      },
    }),
    prisma.event.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return `Rapport d'activité de la plateforme

Statistiques générales:
- Utilisateurs totaux: ${totalUsers}
- Utilisateurs actifs: ${activeUsers}
- Projets créés: ${totalProjects}
- Tâches créées: ${totalTasks}
- Fichiers uploadés: ${totalFiles}
- Événements programmés: ${totalEvents}

Activité récente (30 derniers jours):
- Nouvelles tâches: ${recentTasks}
- Nouveaux événements: ${recentEvents}

Ce rapport fournit un aperçu de l'activité globale de la plateforme.`;
}

async function generatePerformanceReport(): Promise<string> {
  const [
    completedTasks,
    totalTasks,
    activeProjects,
    totalProjects,
    averageTasksPerProject,
  ] = await Promise.all([
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.task.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.project.count(),
    prisma.task.groupBy({
      by: ["projectId"],
      _count: { id: true },
      where: { projectId: { not: null } },
    }),
  ]);

  const completionRate =
    totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : "0";
  const projectActivityRate =
    totalProjects > 0
      ? ((activeProjects / totalProjects) * 100).toFixed(1)
      : "0";
  const avgTasks =
    averageTasksPerProject.length > 0
      ? (
          averageTasksPerProject.reduce(
            (sum, item) => sum + item._count.id,
            0
          ) / averageTasksPerProject.length
        ).toFixed(1)
      : "0";

  return `Rapport de performance de la plateforme

Métriques de performance:
- Taux de completion des tâches: ${completionRate}%
- Taux d'activité des projets: ${projectActivityRate}%
- Nombre moyen de tâches par projet: ${avgTasks}

Analyse:
- ${completedTasks} tâches terminées sur ${totalTasks} au total
- ${activeProjects} projets actifs sur ${totalProjects} projets créés

Recommandations:
- Maintenir le taux de completion actuel pour une bonne performance
- Encourager la création de projets actifs`;
}

async function generateFinancialReport(): Promise<string> {
  // Pour un vrai rapport financier, on aurait besoin de données de facturation/paiements
  // Ici on simule avec des métriques d'utilisation
  const [totalUsers, totalProjects, totalTasks, totalFiles, totalEvents] =
    await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.file.count(),
      prisma.event.count(),
    ]);

  // Estimation fictive basée sur l'utilisation
  const estimatedValue =
    totalUsers * 10 +
    totalProjects * 50 +
    totalTasks * 5 +
    totalFiles * 1 +
    totalEvents * 20;

  return `Rapport financier de la plateforme

Métriques d'utilisation (base de calcul):
- Utilisateurs: ${totalUsers}
- Projets: ${totalProjects}
- Tâches: ${totalTasks}
- Fichiers: ${totalFiles}
- Événements: ${totalEvents}

Estimation de valeur (calcul fictif):
- Valeur estimée de la plateforme: ${estimatedValue}€

Note: Ce rapport utilise des métriques d'utilisation pour estimer la valeur.
Pour un rapport financier réel, il faudrait intégrer des données de facturation et paiements.`;
}

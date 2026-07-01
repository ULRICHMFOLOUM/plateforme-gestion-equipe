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

    // Récupérer les statistiques
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      totalTasks,
      totalFiles,
      totalEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.project.count(),
      prisma.task.count(),
      prisma.file.count(),
      prisma.event.count(),
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      totalProjects,
      totalTasks,
      totalFiles,
      totalEvents,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

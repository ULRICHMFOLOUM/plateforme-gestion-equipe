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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalReports,
      activityReports,
      performanceReports,
      financialReports,
      recentReports,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { type: "ACTIVITY" } }),
      prisma.report.count({ where: { type: "PERFORMANCE" } }),
      prisma.report.count({ where: { type: "FINANCIAL" } }),
      prisma.report.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    const stats = {
      totalReports,
      activityReports,
      performanceReports,
      financialReports,
      recentReports,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques de rapports:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

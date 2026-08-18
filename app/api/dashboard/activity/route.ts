import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const userId = session.user.id;

    // Get user's project IDs for scoping activity
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });
    const projectIds = userProjects.map((p) => p.id);

    // Recent activity logs — scoped to user's projects
    const logs = await prisma.activityLog.findMany({
      where: {
        projectId: { in: projectIds },
      },
      include: {
        user: { select: { name: true, image: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Erreur activity feed:", error);
    return NextResponse.json({ logs: [] });
  }
}

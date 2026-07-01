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

    // Vérifier accès au projet
    const projectMember = await prisma.groupMember.findFirst({
      where: {
        projectId: projectId,
        userId: session.user.id,
      },
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true }
    });

    if (!projectMember && project?.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const activities = await prisma.activityLog.findMany({
      where: { projectId: projectId },
      include: {
        user: {
          select: { name: true, email: true, image: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Erreur activités projet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { accessCode } = await request.json();

    if (!accessCode) {
      return NextResponse.json(
        { error: "Le code d'accès est requis" },
        { status: 400 }
      );
    }

    // Trouver le projet avec ce code
    const project = await prisma.project.findUnique({
      where: { accessCode },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé. Vérifiez le code." },
        { status: 404 }
      );
    }

    // Vérifier si déjà membre
    if (project.members.length > 0) {
      return NextResponse.json(
        { error: "Vous êtes déjà membre de ce projet" },
        { status: 400 }
      );
    }

    // 1. Créer le membre du groupe
    await prisma.groupMember.create({
      data: {
        userId: session.user.id,
        projectId: project.id,
        role: "CONTRIBUTOR",
      }
    });

    // 2. Ajouter automatiquement au Salon de Discussion du Projet (Opération secondaire)
    try {
      const room = await prisma.room.findFirst({
        where: { projectId: project.id }
      });

      if (room) {
        await prisma.roomMember.upsert({
          where: {
            roomId_userId: {
              roomId: room.id,
              userId: session.user.id,
            }
          },
          update: {},
          create: {
            roomId: room.id,
            userId: session.user.id,
          },
        });
      }

      // 3. Journal d'activité
      await prisma.activityLog.create({
        data: {
          action: "MEMBER_JOINED",
          type: "MEMBER",
          details: `${session.user.name || session.user.email} a rejoint le projet via code d'accès`,
          userId: session.user.id,
          projectId: project.id,
        }
      });
    } catch (secondaryError) {
      console.error("Erreur lors des opérations secondaires d'adhésion au projet:", secondaryError);
    }

    return NextResponse.json({
      message: "Vous avez rejoint le projet avec succès",
      projectId: project.id,
      projectName: project.name
    });
  } catch (error) {
    console.error("Erreur join project:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

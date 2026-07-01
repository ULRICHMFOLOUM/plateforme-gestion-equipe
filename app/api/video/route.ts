import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const conferences = await prisma.videoConference.findMany({
      where: {
        AND: [
          {
            OR: [
              { hostId: session.user.id },
              // Optionnel : ajouter logique pour voir les confs des projets dont on est membre
            ],
          },
          projectId ? { projectId } : {},
        ],
      },
      include: {
        host: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json(conferences);
  } catch (error) {
    console.error("Erreur lors de la récupération des conférences:", error);
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

    const { title, description, startTime, projectId } = await request.json();

    if (!title || !startTime) {
      return NextResponse.json(
        { error: "Titre et heure de début requis" },
        { status: 400 }
      );
    }

    const conference = await prisma.videoConference.create({
      data: {
        title,
        description,
        roomId: uuidv4(),
        startTime: new Date(startTime),
        hostId: session.user.id,
        projectId: projectId || undefined,
      },
      include: {
        host: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(conference, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la conférence:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

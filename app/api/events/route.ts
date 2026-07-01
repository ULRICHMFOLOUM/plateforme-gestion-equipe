import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const events = await prisma.event.findMany({
      where: {
        AND: [
          projectId ? { projectId } : {},
          // Allow users to see events of projects they belong to, or their own events
          {
            OR: [
              { userId: session.user.id },
              projectId ? {
                Project: {
                  members: {
                    some: { userId: session.user.id }
                  }
                }
              } : {}
            ]
          }
        ],
      },
      include: {
        user: {
          select: { name: true, email: true, image: true }
        },
        Project: {
          select: { name: true, color: true }
        }
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
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
      startDate,
      endDate,
      location,
      projectId,
    } = body;

    if (!title || !startDate) {
      return NextResponse.json(
        { error: "Titre et date de début requis" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : new Date(startDate),
        location,
        userId: session.user.id,
        projectId: projectId || undefined,
      },
      include: {
        user: {
          select: { name: true, email: true }
        },
        Project: {
          select: { name: true }
        }
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

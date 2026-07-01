import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
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
      include: {
        owner: true,
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name, description, memberIds } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Le nom du projet est requis" },
        { status: 400 }
      );
    }

    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const project = await prisma.project.create({
      data: {
        name,
        description,
        accessCode,
        ownerId: session.user.id,
      },
      include: {
        owner: true,
      },
    });

    // Ajouter les membres sélectionnés si fournis
    if (memberIds && memberIds.length > 0) {
      await prisma.groupMember.createMany({
        data: memberIds.map((userId: string) => ({
          userId,
          groupId: null, // Membres individuels (pas dans un groupe)
          projectId: project.id,
          role: "MEMBER",
        })),
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");

    if (!projectId) {
      return NextResponse.json(
        { error: "ID du projet requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire du projet
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut supprimer le projet" },
        { status: 403 }
      );
    }

    // Supprimer le projet (les relations seront supprimées automatiquement grâce aux contraintes de clés étrangères)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "Projet supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

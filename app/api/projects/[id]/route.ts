import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: true,
        tasks: {
          include: {
            assignee: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        members: {
          include: {
            user: true,
          },
        },
        rooms: {
          select: { id: true, type: true },
          take: 1
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Vérifier si l'utilisateur a accès à ce projet
    const isOwner = project.ownerId === session.user.id;
    const isMember = project.members.some(
      (member) => member.userId === session.user.id
    );

    if (!isOwner && !isMember) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name, description, status, priority, progress, isFavorite, startDate, endDate, budget, spent, color, tags } = await request.json();

    // For favorite toggle, allow any project member (not just owner)
    let project;
    if (isFavorite !== undefined) {
      project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
          members: {
            where: { userId: session.user.id }
          }
        },
      });
    } else {
      project = await prisma.project.findUnique({
        where: { id: params.id },
        select: { ownerId: true },
      });
    }

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Check access - owner or member can toggle favorite, only owner can edit other fields
    const isOwner = 'ownerId' in project ? project.ownerId === session.user.id : false;
    const isMember = 'members' in project && project.members.length > 0;
    
    if (isFavorite !== undefined) {
      // Any member can toggle favorite
      if (!isOwner && !isMember) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    } else {
      // Only owner can edit other fields
      if (!isOwner) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    // Parse priority enum
    let priorityEnum;
    if (priority) {
      priorityEnum = priority.toUpperCase();
    }

    // Parse status enum
    let statusEnum;
    if (status) {
      statusEnum = status.toUpperCase();
    }

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(statusEnum && { status: statusEnum }),
        ...(priorityEnum && { priority: priorityEnum }),
        ...(progress !== undefined && { progress }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(budget !== undefined && { budget }),
        ...(spent !== undefined && { spent }),
        ...(color && { color }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags.join(',') : tags }),
      },
      include: {
        owner: true,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: params.id },
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

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

    // Vérifier que le projet existe et que l'utilisateur y a accès
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: true,
        members: {
          include: {
            user: true,
            group: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const isOwner = project.ownerId === session.user.id;
    const isMember = project.members.some(
      (member) => member.userId === session.user.id
    );

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer tous les groupes disponibles
    const allGroups = await prisma.group.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Séparer les groupes assignés et non assignés
    const assignedGroups = project.members
      .filter((member) => member.groupId)
      .map((member) => member.group);

    const availableGroups = allGroups.filter(
      (group) => !assignedGroups.some((assigned) => assigned.id === group.id)
    );

    return NextResponse.json({
      assignedGroups,
      availableGroups,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des groupes:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { groupId } = await request.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "L'ID du groupe est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le projet existe et que l'utilisateur est propriétaire
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut gérer les groupes du projet" },
        { status: 403 }
      );
    }

    // Vérifier que le groupe existe
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
    }

    // Vérifier que le groupe n'est pas déjà assigné au projet
    const existingAssignment = await prisma.groupMember.findFirst({
      where: {
        groupId,
        projectId: params.id,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Ce groupe est déjà assigné au projet" },
        { status: 400 }
      );
    }

    // Créer les membres du groupe pour ce projet
    const groupMembers = await prisma.groupMember.createMany({
      data: group.members.map((member) => ({
        userId: member.userId,
        groupId,
        projectId: params.id,
        role: member.role,
      })),
    });

    return NextResponse.json({
      message: "Groupe assigné au projet avec succès",
      membersAdded: groupMembers.count,
    });
  } catch (error) {
    console.error("Erreur lors de l'assignation du groupe:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { error: "L'ID du groupe est requis" },
        { status: 400 }
      );
    }

    // Vérifier que le projet existe et que l'utilisateur est propriétaire
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Seul le propriétaire peut gérer les groupes du projet" },
        { status: 403 }
      );
    }

    // Supprimer tous les membres du groupe pour ce projet
    const deleteResult = await prisma.groupMember.deleteMany({
      where: {
        groupId,
        projectId: params.id,
      },
    });

    return NextResponse.json({
      message: "Groupe retiré du projet avec succès",
      membersRemoved: deleteResult.count,
    });
  } catch (error) {
    console.error("Erreur lors du retrait du groupe:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Fetch all project members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
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

    // Récupérer les stats de tâches pour tous les membres en une seule requête pour performance
    const taskStats = await prisma.task.groupBy({
      by: ["assigneeId", "status"],
      where: { projectId: params.id },
      _count: { id: true },
    });

    const getMemberStats = (userId: string) => {
      const userTasks = taskStats.filter((s) => s.assigneeId === userId);
      const total = userTasks.reduce((sum, s) => sum + s._count.id, 0);
      const done = userTasks.find((s) => s.status === "DONE")?._count.id || 0;
      return {
        assignedTasksCount: total,
        completedTasksCount: done,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    };

    // Transform data to include role mapping and stats
    const members = project.members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      name: member.user.name || member.user.email,
      email: member.user.email,
      avatar: member.user.name
        ? member.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : member.user.email.substring(0, 2).toUpperCase(),
      image: member.user.image,
      role: member.role,
      joinedAt: member.createdAt,
      stats: getMemberStats(member.user.id),
    }));

    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      owner: {
        id: project.owner.id,
        userId: project.owner.id,
        name: project.owner.name || project.owner.email,
        email: project.owner.email,
        avatar: project.owner.name
          ? project.owner.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
          : project.owner.email.substring(0, 2).toUpperCase(),
        stats: getMemberStats(project.owner.id),
      },
      members,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Add a member to the project
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Only owner or manager can add members
    const currentMember = await prisma.groupMember.findFirst({
      where: { projectId: params.id, userId: session.user.id }
    });

    const isOwner = project.ownerId === session.user.id;
    const isManager = currentMember && (currentMember.role === 'OWNER' || currentMember.role === 'MANAGER' || currentMember.role === 'ADMIN');

    if (!isOwner && !isManager) {
      return NextResponse.json(
        { error: "Seul le propriétaire ou un manager peut ajouter des membres" },
        { status: 403 }
      );
    }

    const { userId, role } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur requis" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findFirst({
      where: {
        userId: userId,
        projectId: params.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "L'utilisateur est déjà membre du projet" },
        { status: 400 }
      );
    }

    // Check if user is the owner
    if (project.ownerId === userId) {
      return NextResponse.json(
        { error: "Le propriétaire est déjà membre du projet" },
        { status: 400 }
      );
    }

    // Map role to GroupRole enum
    const groupRole = (role || 'CONTRIBUTOR').toUpperCase();

    // 1. Récupérer les détails du projet pour la notification
    const projectDetails = await prisma.project.findUnique({
      where: { id: params.id },
      select: { name: true }
    });

    // 2. Créer le membre (Opération principale)
    const newMemberData = await prisma.groupMember.create({
      data: {
        userId: userId,
        projectId: params.id,
        role: groupRole as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Opérations secondaires (notifications, chat, logs)
    try {
      // 3. Créer la notification
      await prisma.notification.create({
        data: {
          userId: userId,
          type: "PROJECT_INVITE",
          title: "Nouvel accès au projet",
          message: `Vous avez été ajouté au projet "${projectDetails?.name}" en tant que ${groupRole.toLowerCase()}.`,
          data: JSON.stringify({ projectId: params.id }),
        },
      });

      // 4. Ajouter au Salon de Discussion du Projet
      const room = await prisma.room.findFirst({
        where: { projectId: params.id }
      });

      if (room) {
        await prisma.roomMember.upsert({
          where: {
            roomId_userId: {
              roomId: room.id,
              userId,
            }
          },
          update: {},
          create: {
            roomId: room.id,
            userId,
          },
        });
      }

      // 5. Journal d'activité
      await prisma.activityLog.create({
        data: {
          action: "MEMBER_JOINED",
          type: "MEMBER",
          details: `L'utilisateur ${newMemberData.user.name || newMemberData.user.email} a rejoint le projet (${groupRole}).`,
          userId: session.user.id,
          projectId: params.id,
        },
      });
    } catch (secondaryError) {
      console.error("Erreur lors des opérations secondaires d'ajout de membre:", secondaryError);
    }

    const newMember = newMemberData;

    return NextResponse.json({
      id: newMember.id,
      userId: newMember.user.id,
      name: newMember.user.name || newMember.user.email,
      email: newMember.user.email,
      avatar: newMember.user.name
        ? newMember.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : newMember.user.email.substring(0, 2).toUpperCase(),
      image: newMember.user.image,
      role: newMember.role,
      joinedAt: newMember.createdAt,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Update member role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Only owner or manager can update roles
    const currentMember = await prisma.groupMember.findFirst({
      where: { projectId: params.id, userId: session.user.id }
    });

    const isOwner = project.ownerId === session.user.id;
    const isManager = currentMember && (currentMember.role === 'OWNER' || currentMember.role === 'MANAGER' || currentMember.role === 'ADMIN');

    if (!isOwner && !isManager) {
      return NextResponse.json(
        { error: "Seul le propriétaire ou un manager peut modifier les rôles" },
        { status: 403 }
      );
    }

    const { memberId, role } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: "ID du membre requis" },
        { status: 400 }
      );
    }

    // Map role to GroupRole enum
    const groupRole = role.toUpperCase();

    const updatedMember = await prisma.groupMember.update({
      where: { id: memberId },
      data: {
        role: groupRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedMember.id,
      userId: updatedMember.user.id,
      name: updatedMember.user.name || updatedMember.user.email,
      email: updatedMember.user.email,
      avatar: updatedMember.user.name
        ? updatedMember.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : updatedMember.user.email.substring(0, 2).toUpperCase(),
      image: updatedMember.user.image,
      role: updatedMember.role,
      joinedAt: updatedMember.createdAt,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a member from the project
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

    // Only owner or manager can remove members
    const currentMember = await prisma.groupMember.findFirst({
      where: { projectId: params.id, userId: session.user.id }
    });

    const isOwner = project.ownerId === session.user.id;
    const isManager = currentMember && (currentMember.role === 'OWNER' || currentMember.role === 'MANAGER' || currentMember.role === 'ADMIN');

    if (!isOwner && !isManager) {
      return NextResponse.json(
        { error: "Seul le propriétaire ou un manager peut retirer des membres" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: "ID du membre requis" },
        { status: 400 }
      );
    }

    await prisma.groupMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "Membre retiré avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

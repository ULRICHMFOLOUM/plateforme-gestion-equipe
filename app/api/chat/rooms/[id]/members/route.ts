import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Get room members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: {
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

    if (!room) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    // Check if user is a member
    const isMember = room.members.some((m) => m.userId === session.user.id);

    if (!isMember) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const members = room.members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      name: member.user.name || member.user.email,
      email: member.user.email,
      avatar: member.user.name
        ? member.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : member.user.email.substring(0, 2).toUpperCase(),
      image: member.user.image,
    }));

    return NextResponse.json({
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
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

// POST - Add members to a room
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: {
        members: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    // Check if user is a member (for DIRECT rooms, only the creator can add)
    const isMember = room.members.some((m) => m.userId === session.user.id);
    
    if (!isMember) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // For DIRECT rooms, only the creator can add members (to convert to GROUP)
    if (room.type === "DIRECT") {
      return NextResponse.json(
        { error: "Impossible d'ajouter des membres à une conversation directe. Créez une nouvelle conversation de groupe." },
        { status: 400 }
      );
    }

    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "IDs des utilisateurs requis" },
        { status: 400 }
      );
    }

    // Add new members
    const newMembers = [];
    for (const userId of userIds) {
      // Check if user is already a member
      const existingMember = room.members.find((m) => m.userId === userId);
      
      if (!existingMember) {
        const newMember = await prisma.roomMember.create({
          data: {
            roomId: params.id,
            userId: userId,
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

        newMembers.push({
          id: newMember.id,
          userId: newMember.user.id,
          name: newMember.user.name || newMember.user.email,
          email: newMember.user.email,
          avatar: newMember.user.name
            ? newMember.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
            : newMember.user.email.substring(0, 2).toUpperCase(),
          image: newMember.user.image,
        });
      }
    }

    return NextResponse.json({
      message: `${newMembers.length} membre(s) ajouté(s)`,
      members: newMembers,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout des membres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a member from a room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const room = await prisma.room.findUnique({
      where: { id: params.id },
      include: {
        members: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    // Check if user is a member
    const isMember = room.members.some((m) => m.userId === session.user.id);
    
    if (!isMember) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: "ID du membre requis" },
        { status: 400 }
      );
    }

    // Check if trying to remove the room creator
    if (room.createdById === memberId) {
      return NextResponse.json(
        { error: "Impossible de retirer le créateur de la conversation" },
        { status: 400 }
      );
    }

    await prisma.roomMember.delete({
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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all members of a room with user details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const roomId = params.id;
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                jobTitle: true,
                department: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Salon non trouvé" }, { status: 404 });
    }

    // Check if requester is a member of the room
    const isMember = room.members.some((m) => m.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const members = room.members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      jobTitle: m.user.jobTitle,
      department: m.user.department,
      isAdmin: room.createdById === m.user.id,
    }));

    return NextResponse.json({
      roomId: room.id,
      name: room.name,
      type: room.type,
      createdById: room.createdById,
      members,
    });
  } catch (error: any) {
    console.error("Erreur récuperation membres salon:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add member(s) to a room
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const roomId = params.id;
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "IDs utilisateurs requis" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { members: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Salon introuvable" }, { status: 404 });
    }

    // Check if requester is a member of the room
    const isMember = room.members.some((m) => m.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Vous devez être membre du groupe" }, { status: 403 });
    }

    // Filter out existing members
    const existingUserIds = new Set(room.members.map((m) => m.userId));
    const newUserIds = userIds.filter((id: string) => !existingUserIds.has(id));

    if (newUserIds.length === 0) {
      return NextResponse.json({ message: "Les membres sont déjà dans le groupe" });
    }

    // Create member records
    await prisma.roomMember.createMany({
      data: newUserIds.map((userId: string) => ({
        roomId,
        userId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ message: "Membres ajoutés avec succès" });
  } catch (error: any) {
    console.error("Erreur ajout membres salon:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove a member from a room
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const roomId = params.id;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "ID de membre requis" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Salon introuvable" }, { status: 404 });
    }

    // Admin privileges: Only room creator or self-leave allowed
    const isCreator = room.createdById === session.user.id;
    const isSelf = targetUserId === session.user.id;

    if (!isCreator && !isSelf) {
      return NextResponse.json(
        { error: "Seul l'administrateur du groupe peut retirer un membre" },
        { status: 403 }
      );
    }

    await prisma.roomMember.deleteMany({
      where: {
        roomId,
        userId: targetUserId,
      },
    });

    return NextResponse.json({ message: "Membre retiré du groupe" });
  } catch (error: any) {
    console.error("Erreur suppression membre salon:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

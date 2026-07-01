import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "L'ID de l'utilisateur est requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur n'est pas déjà membre du groupe
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId_projectId: {
          userId,
          groupId: params.id,
          projectId: null,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "L'utilisateur est déjà membre de ce groupe" },
        { status: 400 }
      );
    }

    const member = await prisma.groupMember.create({
      data: {
        userId,
        groupId: params.id,
        role: "MEMBER",
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Erreur lors de l'ajout du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

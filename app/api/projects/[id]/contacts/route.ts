import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Get contacts for project member selection
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { 
        ownerId: true,
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Check if user is owner
    if (project.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const currentUserId = session.user.id;
    const existingMemberIds = project.members.map((m) => m.userId);

    // Get user's contacts
    const contacts = await prisma.contact.findMany({
      where: {
        userId: currentUserId,
        status: "ACCEPTED",
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Filter out existing project members
    const availableContacts = contacts
      .filter((c) => !existingMemberIds.includes(c.contact.id))
      .map((c) => ({
        id: c.contact.id,
        userId: c.contact.id,
        name: c.contact.name || c.contact.email,
        email: c.contact.email,
        avatar: c.contact.name
          ? c.contact.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
          : c.contact.email.substring(0, 2).toUpperCase(),
        image: c.contact.image,
      }));

    return NextResponse.json(availableContacts);
  } catch (error) {
    console.error("Erreur lors de la récupération des contacts:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

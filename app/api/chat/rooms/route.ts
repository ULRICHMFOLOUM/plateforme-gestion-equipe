import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API Route : Gestion des Salons de Chat (Rooms)
 * Permet de récupérer la liste des discussions et d'en créer de nouvelles.
 */

/**
 * GET - Récupère tous les salons auxquels l'utilisateur connecté appartient.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // Récupération des salons avec les membres et le dernier message
    const userRooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
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
        messages: {
          orderBy: {
            sentAt: "desc", // Trie pour avoir le message le plus récent en premier
          },
          take: 1, // On ne récupère que le dernier message pour l'aperçu
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatage des données pour le frontend
    const formattedRooms = userRooms.map((room) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      lastMessage: room.messages[0] ? {
          id: room.messages[0].id,
          content: room.messages[0].content,
          senderId: room.messages[0].senderId,
          timestamp: room.messages[0].sentAt,
      } : undefined,
      participants: room.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
      })),
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error("Erreur lors de la récupération des salons:", error);
    return new NextResponse("Erreur Interne", { status: 500 });
  }
}

/**
 * POST - Crée un nouveau salon (Conversation Directe ou Groupe)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { name, type, participants } = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // Cas particulier : Pour les conversations privées (DIRECT), 
    // on vérifie si une conversation existe déjà entre ces deux personnes.
    if (type === "DIRECT") {
      const existingRoom = await prisma.room.findFirst({
        where: {
          type: "DIRECT",
          members: {
            every: {
              userId: {
                in: [session.user.id, ...participants],
              },
            },
          },
        },
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

      // Si elle existe, on renvoie simplement les infos de ce salon
      if (existingRoom) {
        return NextResponse.json({
          id: existingRoom.id,
          name: existingRoom.name,
          type: existingRoom.type,
          participants: existingRoom.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
          })),
        });
      }
    }

    // Sinon, on crée un nouveau salon en base de données
    const newRoom = await prisma.room.create({
      data: {
        name: name || (type === "DIRECT" ? "Conversation privée" : "Nouveau groupe"),
        type: type || "DIRECT",
        createdById: session.user.id,
        members: {
          create: [
            { userId: session.user.id }, // On s'ajoute soi-même en membre
            ...participants.map((id: string) => ({ userId: id })), // On ajoute les autres participants
          ],
        },
      },
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

    return NextResponse.json({
      id: newRoom.id,
      name: newRoom.name,
      type: newRoom.type,
      participants: newRoom.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la création du salon:", error);
    return new NextResponse("Erreur Interne", { status: 500 });
  }
}

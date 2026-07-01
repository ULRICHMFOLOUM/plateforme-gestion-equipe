import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET : Récupère la liste des projets de l'utilisateur connecté
 * (Projets possédés ou projets où il est membre)
 */
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

/**
 * POST : Création d'un nouveau projet
 * Gère la création du projet, de l'espace de chat, des membres initiaux et des logs en une seule opération.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name, description, color = "blue", members = [] } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Le nom du projet est requis" },
        { status: 400 }
      );
    }

    // Générer un code d'accès court et unique (ex: AX2Z7B)
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    console.log('Création du projet:', { name, color, accessCode });
    
    /**
     * Utilisation de Prisma 'create' avec 'data' imbriqué.
     * Cette approche est préférée aux transactions interactives pour éviter les timeouts 
     * sur les plateformes serverless/cloud.
     */
    const project = await prisma.project.create({
      data: {
        name,
        description,
        color,
        accessCode,
        ownerId: session.user.id,
        // Étape 1 : Ajouter automatiquement le créateur comme Propriétaire (OWNER)
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          }
        },
        // Étape 2 : Créer automatiquement le salon de discussion (Room) associé
        rooms: {
          create: {
            name: `Discussion : ${name}`,
            type: "GROUP",
            createdById: session.user.id,
            // Ajouter le créateur comme premier membre du salon
            members: {
              create: {
                userId: session.user.id
              }
            }
          }
        },
        // Étape 3 : Créer une entrée dans le journal d'activité (Audit Trail)
        activityLogs: {
          create: {
            action: "PROJECT_CREATED",
            type: "PROJECT",
            details: `Projet "${name}" créé avec le code ${accessCode}. Salon de discussion initialisé.`,
            userId: session.user.id,
          }
        }
      },
      include: {
        owner: true,
      },
    });
    
    console.log('Setup initial du projet et du chat terminé:', project.id);

    // Étape 4 : Gestion des membres additionnels sélectionnés dans l'UI
    const otherMembers = (members || []).filter((m: any) => m.id !== session.user.id);

    if (otherMembers.length > 0) {
      try {
        // Récupérer la room créée précédemment pour y ajouter les membres
        const chatRoom = await prisma.room.findFirst({
          where: { projectId: project.id }
        });

        // Parallélisation de l'ajout des membres (Performance accrue)
        await Promise.all(
          otherMembers.map(async (member: { id: string; role: string }) => {
            const userId = member.id;
            const role = member.role || "CONTRIBUTOR";

            // Sécurité : Vérifier si le membre existe déjà
            const existingMember = await prisma.groupMember.findFirst({
              where: {
                userId,
                projectId: project.id,
              }
            });

            if (!existingMember) {
              await prisma.groupMember.create({
                data: {
                  userId,
                  projectId: project.id,
                  role: role as any,
                },
              });
            }

            // Ajout concomitant au salon de discussion
            if (chatRoom) {
              const existingRoomMember = await prisma.roomMember.findUnique({
                where: {
                  roomId_userId: {
                    roomId: chatRoom.id,
                    userId,
                  }
                }
              });

              if (!existingRoomMember) {
                await prisma.roomMember.create({
                  data: {
                    roomId: chatRoom.id,
                    userId,
                  },
                });
              }
            }
          })
        );
      } catch (memberError) {
        console.error('Erreur lors de l\'ajout des membres additionnels:', memberError);
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Erreur détaillée lors de la création du projet:", error);
    return NextResponse.json(
      { 
        error: "Erreur interne du serveur", 
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE : Supprime un projet (Seul le propriétaire ou un admin peut le faire)
 */
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

    // Vérifier les droits d'accès
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const isOwner = project.ownerId === session.user.id;
    const isGlobalAdmin = session.user.role === 'ADMIN';

    if (!isOwner && !isGlobalAdmin) {
      return NextResponse.json(
        { error: "Permissions insuffisantes pour supprimer ce projet" },
        { status: 403 }
      );
    }

    // Suppression en cascade (Prisma gère la suppression des membres/tasks/rooms via le schema)
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

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = params.roomId;

    // Vérifier que l'utilisateur est membre de la salle
    const roomMember = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId: session.user.id,
      },
    });

    if (!roomMember) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de cette salle" },
        { status: 403 }
      );
    }

    // Récupérer TOUS les messages (sans limite stricte pour éviter pagination)
    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        files: true,
      },
      orderBy: {
        sentAt: "asc",
      },
    });

    // Formater pour le client
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name || message.sender.email,
      senderImage: message.sender.image,
      timestamp: message.sentAt,
      roomId: message.roomId,
      files: message.files.map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url,
      })),
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching room messages:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


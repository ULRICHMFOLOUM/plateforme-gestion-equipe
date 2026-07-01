import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { content, roomId, files } = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!content && (!files || files.length === 0)) {
        return new NextResponse("Invalid request", { status: 400 });
    }

    // Sauvegarder le message en base de données
    const message = await prisma.chatMessage.create({
      data: {
        content: content || "",
        senderId: session.user.id,
        roomId,
        files: files
          ? {
              create: files.map((file: any) => ({
                name: file.name,
                url: file.url,
                size: file.size,
                type: file.type,
              })),
            }
          : undefined,
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
    });

    const messageData = {
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
    };

    // Déclencher l'événement Pusher sur le canal de la salle
    await pusherServer.trigger(`presence-room-${roomId}`, "message", messageData);

    return NextResponse.json(messageData);
  } catch (error) {
    console.error("CHAT SEND ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

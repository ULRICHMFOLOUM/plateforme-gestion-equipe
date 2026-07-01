import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { roomId } = params;

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Vérifier que l'utilisateur est membre de la salle
    const roomMember = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId: session.user.id,
      },
    });

    if (!roomMember) {
      return new NextResponse("Forbidden", { status: 403 });
    }

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
    console.error("GET MESSAGES ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

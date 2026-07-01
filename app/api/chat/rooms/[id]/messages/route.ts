import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = params.id;

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

    // Récupérer les messages de la salle
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = params.id;
    const { content, fileIds = [] } = await request.json();

    if (!content && fileIds.length === 0) {
      return NextResponse.json(
        { error: "Message content or files required" },
        { status: 400 }
      );
    }

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

    // Créer le message
    const message = await prisma.chatMessage.create({
      data: {
        content,
        roomId,
        senderId: session.user.id,
        files: {
          connect: fileIds.map((id: string) => ({ id })),
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        files: true,
      },
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { lastMessageAt: new Date() },
    });

    // Créer des notifications pour les autres membres
    const otherMembers = await prisma.roomMember.findMany({
      where: {
        roomId,
        userId: { not: session.user.id }
      },
      include: {
        room: true
      }
    });

    if (otherMembers.length > 0) {
      const isVideoInvite = content.includes("visioconférence") || content.includes("/video/join");
      
      await prisma.notification.createMany({
        data: otherMembers.map(m => ({
          userId: m.userId,
          type: "GENERAL",
          title: isVideoInvite ? "Invitation à une réunion" : "Nouveau message",
          message: isVideoInvite 
            ? `${session.user.name || session.user.email} vous invite à une visioconférence.`
            : `${session.user.name || session.user.email} vous a envoyé un message dans ${m.room.name || 'la discussion'}.`,
          data: JSON.stringify({ roomId, messageId: message.id, type: isVideoInvite ? 'video_invite' : 'chat_message' }),
        }))
      });
    }

    const formattedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name || message.sender.email,
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

    return NextResponse.json(formattedMessage, { status: 201 });
  } catch (error) {
    console.error("Error creating chat message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

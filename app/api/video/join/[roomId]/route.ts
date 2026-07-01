import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public route — no authentication needed (just room ID lookup)
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const conference = await prisma.videoConference.findUnique({
      where: { roomId: params.roomId },
      include: {
        host: {
          select: { name: true, email: true },
        },
      },
    });

    if (!conference) {
      return NextResponse.json({ error: "Conférence introuvable" }, { status: 404 });
    }

    // Return only safe public info
    return NextResponse.json({
      id: conference.id,
      title: conference.title,
      description: conference.description,
      roomId: conference.roomId,
      startTime: conference.startTime,
      status: conference.status,
      host: conference.host,
    });
  } catch (error) {
    console.error("Erreur join conference:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

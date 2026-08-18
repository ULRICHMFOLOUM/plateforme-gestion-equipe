import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");
    const folderId = searchParams.get("folderId");

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const whereCondition: any = { userId: session.user.id };

    if (projectId) whereCondition.projectId = projectId;
    if (taskId) whereCondition.taskId = taskId;

    if (folderId && folderId !== "null" && folderId !== "all") {
      whereCondition.folderId = folderId === "root" ? null : folderId;
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: whereCondition,
        include: {
          folder: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { uploadedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.file.count({ where: whereCondition }),
    ]);

    return NextResponse.json({ files, total });
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name, url, size, type, projectId, folderId } = await request.json();

    if (!name || !url) {
      return NextResponse.json({ error: "Nom et URL de fichier requis" }, { status: 400 });
    }

    const file = await prisma.file.create({
      data: {
        name,
        url,
        size: Number(size) || 0,
        type: type || "document",
        userId: session.user.id,
        projectId: projectId || null,
        folderId: (folderId && folderId !== "root") ? folderId : null,
      },
    });

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error("Erreur création fichier:", error);
    return NextResponse.json({ error: "Erreur lors du téléversement" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");

    if (!fileId) return NextResponse.json({ error: "ID de fichier requis" }, { status: 400 });

    await prisma.file.delete({
      where: { id: fileId, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression fichier:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}

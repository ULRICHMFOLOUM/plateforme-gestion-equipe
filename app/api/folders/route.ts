import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const parentFolderId = searchParams.get("parentFolderId");
    const projectId = searchParams.get("projectId");

    const whereCondition: any = { userId: session.user.id };

    if (projectId) {
      whereCondition.projectId = projectId;
    }

    if (parentFolderId && parentFolderId !== "null" && parentFolderId !== "root") {
      whereCondition.parentFolderId = parentFolderId;
    } else {
      whereCondition.parentFolderId = null;
    }

    const folders = await prisma.folder.findMany({
      where: whereCondition,
      include: {
        _count: { select: { files: true, subFolders: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ folders });
  } catch (error) {
    console.error("Erreur récupération dossiers:", error);
    return NextResponse.json({ folders: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { name, color, parentFolderId, projectId } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nom de dossier requis" }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        color: color || "blue",
        userId: session.user.id,
        projectId: projectId || null,
        parentFolderId: (parentFolderId && parentFolderId !== "root") ? parentFolderId : null,
      },
    });

    return NextResponse.json({ success: true, folder });
  } catch (error) {
    console.error("Erreur création dossier:", error);
    return NextResponse.json({ error: "Erreur lors de la création du dossier" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("id");

    if (!folderId) return NextResponse.json({ error: "ID de dossier requis" }, { status: 400 });

    await prisma.folder.delete({
      where: { id: folderId, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur suppression dossier:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}

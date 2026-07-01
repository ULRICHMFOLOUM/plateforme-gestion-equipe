import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const fileId = params.id;

    // Récupérer le fichier pour vérifier la propriété
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire du fichier
    if (file.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Supprimer le fichier physique
    try {
      const filePath = join(process.cwd(), "public", file.url);
      await unlink(filePath);
    } catch (error) {
      console.warn("Erreur lors de la suppression du fichier physique:", error);
      // Ne pas échouer si le fichier physique n'existe pas
    }

    // Supprimer le fichier de la base de données
    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ message: "Fichier supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
